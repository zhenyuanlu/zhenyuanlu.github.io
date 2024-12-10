document.addEventListener("DOMContentLoaded", function() {
  // Get filter elements
  const typeFilter = document.getElementById("typeFilter");
  const tagFilter = document.getElementById("tagFilter");
  const searchInput = document.getElementById("searchInput");
  const noBlogsMessage = document.getElementById("noBlogsMessage");
  const blogGrid = document.getElementById("blogGrid");

  function filterBlogs() {
    const searchValue = searchInput.value.toLowerCase();
    const typeValue = typeFilter.value;
    const tagValue = tagFilter.value;
    
    const blogs = document.querySelectorAll(".blog-card");
    let visibleCount = 0;

    blogs.forEach((blog) => {
      const title = blog.getAttribute("data-title").toLowerCase();
      const type = blog.getAttribute("data-type");
      const tags = blog.getAttribute("data-tags").split(",");
      
      const matchesSearch = title.includes(searchValue);
      const matchesType = typeValue === "all" || type === typeValue;
      const matchesTag = tagValue === "all" || tags.includes(tagValue);

      if (matchesSearch && matchesType && matchesTag) {
        blog.classList.remove("hidden");
        visibleCount++;
      } else {
        blog.classList.add("hidden");
      }
    });

    // Toggle visibility of no results message
    noBlogsMessage.classList.toggle("hidden", visibleCount > 0);
    blogGrid.classList.toggle("hidden", visibleCount === 0);
  }

  // Add event listeners
  typeFilter.addEventListener("change", filterBlogs);
  tagFilter.addEventListener("change", filterBlogs);
  searchInput.addEventListener("keyup", filterBlogs);
});