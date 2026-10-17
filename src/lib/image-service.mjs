// The site's image service: Astro's own (sharp), with one thing more (the speed round's picture policy, 2026-10-16;
// the owner's rule: no picture worse than its source): a picture asked for in one of its two forms
// (lib/picture-forms.mjs: AVIF, and the fallback every browser shows), a format and a quality that name the form, is
// made at every width of its srcset by lib/picture-encode.mjs, at the step of the form's ladder that is like its
// source at that size, as src/lib/image-choices.json keeps it. Any other picture: Astro's own encoder, as before.
// astro.config.mjs names it (image.service).
import sharpService from 'astro/assets/services/sharp';
import { makeForm, NO_CHOICE } from './picture-encode.mjs';

/** @type {import('astro').LocalImageService} */
const service = {
  ...sharpService,
  async transform(input, transform, config, logger) {
    const fmt = transform.format === 'jpeg' ? 'jpg' : transform.format;
    if (!transform.fit && !transform.background && !transform.position) {
      let made;
      try {
        made = await makeForm(input, transform);
      } catch (e) {
        if (e && e.code === NO_CHOICE) logger.error(e.message);   /* (a build in CI: Astro's own message names only the file) */
        throw e;
      }
      if (made) return { data: made.data, format: fmt };
    }
    return sharpService.transform(input, transform, config, logger);
  },
};
export default service;
