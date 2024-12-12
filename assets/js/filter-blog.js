document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("blogSearchInput");
  const typeFilter = document.getElementById("blogTypeFilter");
  const tagFilter = document.getElementById("blogTagFilter");
  const blogGrid = document.getElementById("blogGrid");
  const noBlogMessage = document.getElementById("noBlogMessage");

  function filterBlogs() {
    const searchValue = searchInput.value.toLowerCase().trim();
    const typeValue = typeFilter.value;
    const tagValue = tagFilter.value;
    const blogs = document.querySelectorAll(".blog-card");

    let visibleCount = 0;

    blogs.forEach((blog) => {
      const title = blog.getAttribute("data-title") || "";
      const author = blog.getAttribute("data-author") || "";
      const tags = blog.getAttribute("data-tags") || "";
      const contentType = blog.getAttribute("data-type") || "";

      const matchesSearch =
        title.includes(searchValue) ||
        author.includes(searchValue) ||
        blog.textContent.toLowerCase().includes(searchValue);

      const matchesType = typeValue === "all" || contentType === typeValue;
      const matchesTag = tagValue === "all" || tags.split(",").includes(tagValue);

      if (matchesSearch && matchesType && matchesTag) {
        blog.parentElement.classList.remove("hidden");
        visibleCount++;
      } else {
        blog.parentElement.classList.add("hidden");
      }
    });

    noBlogMessage.classList.toggle("hidden", visibleCount > 0);
    blogGrid.classList.toggle("hidden", visibleCount === 0);
  }

  searchInput.addEventListener("input", filterBlogs);
  typeFilter.addEventListener("change", filterBlogs);
  tagFilter.addEventListener("change", filterBlogs);

  // Initial filter
  filterBlogs();
});
