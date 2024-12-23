
# ZenLu

Well, this is a Jekyll theme that I actually have created for my own page, courses and educational website working with ChatGPT and claude. I named it **Zenlu** as an scientific, and educational theme. If you like it feel free to use it.

This theme heavily built on Tailwind CSS styling. 

# Features, Tasks and Bugs

## TODO:

### &#128029; Bugs
- [x] Fix Navbar underline appearing when refreshing the page 
- [ ] Fix reference styling 
- [ ] Fix blog styling 
- [ ] Fix dark mode issues 
- [ ] Fix color transition issues switching from light mode to dark mode


### &#10024; Features
- [x] Add a holiday themes
- [x] Improve the footer design
- [ ] Add city journey
- [ ] Improve the navigation bar design 
- [ ] Add overwidth image handling 


###  &#128736; Tasks
- [x] Refactor the image container
- [ ] Update seo schema
- [ ] Refactor the hiararchy of the page
- [ ] Dark mode color scheme



---

## Codebase Transition (12/19/2024)

The old codebase and personal page will be deprecated in Dec 2024. The new codebase is now live and available on the `main` branch.  
- **old codebase (legacy):** `old-version-archived` and tagged as `v1.0-old-version`.  
- **new codebase (current):** the `main` branch now reflects the new version of the site.

---


## Prerequisites

- **Ruby:** 
  [Download Ruby](https://www.ruby-lang.org/en/downloads/)

- **Bundler:**

  ```bash
  gem install bundler
  ```

- **Node.js and npm:** Version 14.x.x or higher  
  [Download Node.js](https://nodejs.org/)  

  ```bash
  node -v
  npm -v
  ```

- **Git:** 
  [Download Git](https://git-scm.com/downloads)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/zhenyuanlu/zhenyuanlu.github.io.git
cd zhenyuanlu.github.io
```

### 2. Install Ruby Gems

```bash
bundle install
```

### 3. Install Node.js Dependencies

```bash
npm install
```

## Building Tailwind CSS

- **For Production Build:**
  ```bash
  npm run build:css
  ```

- **For Development (Watch Mode):**
  ```bash
  npm run watch:css
  ```

### Available Scripts in `package.json`

```json
{
  "scripts": {
    "build:css": "npx tailwindcss -i ./assets/css/styles.css -o ./assets/css/styles.css --minify",
    "watch:css": "npx tailwindcss -i ./assets/css/styles.css -o ./assets/css/styles.css --watch"
  }
}
```

## Serving the Site


### 1. Serve with Jekyll

```bash
bundle exec jekyll serve
```

### 2. Development Workflow (Optional)

To streamline the development process by running both Tailwind's, JS watch and Jekyll's serve concurrently, you can use `concurrently`.

#### a. Install `concurrently`
```bash
npm install concurrently --save-dev
```

#### c. Run the Development Server

```bash
npm run start
```

#### d. Build the Site
```bash
npm run build
```


## Acknowledgements

Big &#10084; to **ChatGPT** and **Claude** for refining all the code. 
