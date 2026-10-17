#!/usr/bin/env bash
# After the merge: every old address of zhenyuanlu.com answered as the new site means it to (read only: GET and HEAD
# requests, nothing written anywhere). Run in Git Bash:
#   bash verify-live.sh                       the live site, https://zhenyuanlu.com
#   bash verify-live.sh http://127.0.0.1:PORT a local copy of the build (the reserved paths and HTTPS are skipped)
# Exit 0 when everything holds. GitHub's CDN keeps a page up to 10 minutes (max-age=600): run it 10 minutes after the
# deploy finishes, or again if a page still shows the old site.
set -u
B="${1:-https://zhenyuanlu.com}"
LIVE=0; [ "$B" = "https://zhenyuanlu.com" ] && LIVE=1
bad=0; n=0
ok()   { n=$((n+1)); printf 'ok    %s\n' "$1"; }
fail() { n=$((n+1)); bad=$((bad+1)); printf 'FAIL  %s\n' "$1"; }
code() { curl -s -o /dev/null -I --max-time 20 -w '%{http_code}' "$B$1"; }   # (HEAD: a PDF's bytes are not fetched)
body() { curl -s --max-time 20 "$B$1"; }

# 1. the old addresses that keep their own page or file
for a in / /blog/ /blog/lfia/ /blog/tufts-hia-ai/ /blog/contrastive-learning-for-visual/ /blog/informs-talk/ \
         /blog/artifacts-mitigation-nlp/ /blog/gesture-classification/ /blog/uw-workshop-ssl/ /404.html /robots.txt /CNAME \
         /assets/docs/publications/2015-bmes.pdf /assets/docs/publications/2016-bmes.pdf /assets/docs/publications/2017-bmes.pdf \
         /assets/images/blog/projects/gesture/outline_simple_2.pdf /assets/images/publications/informs/zhenyuan_dataViz.pdf; do
  c=$(code "$a"); [ "$c" = 200 ] && ok "$a 200" || fail "$a $c (want 200)"
done

# 2. the old addresses that lead on: a redirect page (meta refresh at once to the new place, that place its canonical)
while read -r from to; do
  [ -z "$from" ] && continue
  h=$(body "$from"); c=$(code "$from")
  if [ "$c" = 200 ] && printf '%s' "$h" | grep -q 'http-equiv="refresh"' \
     && printf '%s' "$h" | grep -q "rel=\"canonical\" href=\"https://zhenyuanlu.com$to\"" \
     && printf '%s' "$h" | grep -qE "content=\"0;url=(\.\./\.\.)?$to\""; then ok "$from -> $to"
  else fail "$from: $c, not a redirect page to $to"; fi
  t=${to%%#*}; c2=$(code "$t"); [ "$c2" = 200 ] || fail "$from's target $t answers $c2"
done <<'EOF'
/_blog/projects/2017-02-08-lfia.html /blog/lfia/
/_blog/events/2021-01-08-tufts-hia-ai.html /blog/tufts-hia-ai/
/_blog/posts/2022-10-06-contrastive-learning-for-visual.html /blog/contrastive-learning-for-visual/
/_blog/events/2022-10-13-informs-talk.html /blog/informs-talk/
/_blog/posts/2022-12-16-artifacts-mitigation-nlp.html /blog/artifacts-mitigation-nlp/
/_blog/projects/2023-05-16-gesture-classification.html /blog/gesture-classification/
/_blog/events/2023-09-05-uw-workshop-ssl.html /blog/uw-workshop-ssl/
/projects/lfia/ /blog/lfia/
/projects/personalizeMeal/ /build/#mealthup
/projects/hieralytics/ /build/#hieralytics
/projects/tufts/ /blog/tufts-hia-ai/
/projects/dataViz/ /teach/#books
/projects/clVR/ /blog/contrastive-learning-for-visual/
/projects/informs/ /blog/informs-talk/
/projects/artifacts/ /blog/artifacts-mitigation-nlp/
/projects/gesture/ /blog/gesture-classification/
/projects/rlWorkshop/ /blog/uw-workshop-ssl/
EOF

# 3. the new site's own doors, the feed and the maps
for a in /build/ /teach/ /see/ /race/ /race/2025/ /sitemap-index.xml /sitemap-0.xml; do
  c=$(code "$a"); [ "$c" = 200 ] && ok "$a 200" || fail "$a $c (want 200)"
done
body /feed.xml | grep -q '<rss' && [ "$(body /feed.xml | grep -c '<item>')" -ge 1 ] && ok "/feed.xml is RSS with items" || fail "/feed.xml is not the new RSS feed"
body /sitemap.xml | grep -q '<sitemapindex' && ok "/sitemap.xml mirrors the sitemap index" || fail "/sitemap.xml is not the new sitemap index"
body /robots.txt | grep -q '^Sitemap: https://zhenyuanlu.com/sitemap-index.xml' && ok "robots.txt names the sitemap index" || fail "robots.txt has not the new Sitemap line"
[ "$(body /CNAME)" = "zhenyuanlu.com" ] && ok "CNAME is zhenyuanlu.com" || fail "CNAME is not exactly zhenyuanlu.com"
c=$(code /nothing-here/); h=$(body /nothing-here/)
[ "$c" = 404 ] && printf '%s' "$h" | grep -q 'go anywhere' && ok "an unknown address: 404 with the new 404 page" || fail "an unknown address: $c, not the new 404 page"
for a in /projects/central/ /package.json /assets/images/thumbnails/clvr.png; do
  c=$(code "$a"); [ "$c" = 404 ] && ok "$a 404 (let go)" || fail "$a $c (want 404: let go)"
done

# 4. the live site only: HTTPS, and the other repositories' sites at their reserved addresses
if [ $LIVE = 1 ]; then
  r=$(curl -s -o /dev/null -I --max-time 20 -w '%{http_code} %{redirect_url}' http://zhenyuanlu.com/)
  [ "$r" = "301 https://zhenyuanlu.com/" ] && ok "http:// goes to https:// (301)" || fail "http://zhenyuanlu.com/ answers $r"
  curl -s -o /dev/null --max-time 20 https://zhenyuanlu.com/ && ok "the certificate holds" || fail "https://zhenyuanlu.com/: TLS failed"
  for a in /courses/ /artLife/ /python-notebook/ /r-comput-viz/ /waycine/; do
    c=$(code "$a"); h=$(body "$a")
    if [ "$c" = 200 ] && ! printf '%s' "$h" | grep -q 'zl-fade'; then ok "$a 200, its own repository's site"; else fail "$a $c (want 200 from its own repository)"; fi
  done
  r=$(curl -s -o /dev/null -I --max-time 20 -w '%{http_code} %{redirect_url}' https://zhenyuanlu.com/courses)
  [ "$r" = "301 https://zhenyuanlu.com/courses/" ] && ok "/courses goes to /courses/" || fail "/courses answers $r"
fi

# 5. a first look at speed (time to first byte and bytes of each page's HTML; the budgets are npm run check's)
for a in / /blog/ /blog/contrastive-learning-for-visual/ /build/ /teach/ /see/ /race/; do
  curl -s -o /dev/null --max-time 20 -w "speed $a  first byte %{time_starttransfer}s  total %{time_total}s  html %{size_download} B\n" "$B$a"
done

echo "$((n-bad)) of $n hold"
[ $bad = 0 ]
