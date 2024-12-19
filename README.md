# ZenLu  Jekyll Theme

Well, this is a Jekyll theme that I actually have created for my own page, courses and educational website working with ChatGPT and claude. I named it **Zenlu** as an scientific, and educational theme. If you like it feel free to use it.

This theme heavily built on Tailwind CSS styling. 

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

After building the Tailwind CSS, you can serve the Jekyll site locally.

### 1. Serve with Jekyll

```bash
bundle exec jekyll serve
```

### 2. Development Workflow (Optional)

To streamline the development process by running both Tailwind's, JS watch and Jekyll's serve concurrently, you can use a tool like `concurrently`.

#### a. Install `concurrently`
```bash
npm install concurrently --save-dev
```

#### b. Update `package.json` Scripts

Add the following script to your `package.json`:
```json
{
  "scripts": {
  "build:css": "npx tailwindcss -i ./assets/css/input.css -o ./assets/css/styles.css --minify",
  "build:js": "npx esbuild assets/js/filter-blog.js --bundle --minify --outfile=assets/js/filter-blog.min.js && npx esbuild assets/js/toc.js --bundle --minify --outfile=assets/js/toc.min.js && npx esbuild assets/js/zenlu.js --bundle --minify --outfile=assets/js/zenlu.min.js",
  
  "build": "npm run build:css && npm run build:js && bundle exec jekyll build",

  "watch:css": "npx tailwindcss -i ./assets/css/input.css -o ./assets/css/styles.css --watch",
  "watch:filter-blog": "npx esbuild assets/js/filter-blog.js --bundle --minify --outfile=assets/js/filter-blog.min.js --watch",
  "watch:toc": "npx esbuild assets/js/toc.js --bundle --minify --outfile=assets/js/toc.min.js --watch",
  "watch:zenlu": "npx esbuild assets/js/zenlu.js --bundle --minify --outfile=assets/js/zenlu.min.js --watch",

  "watch:js": "concurrently \"npm run watch:filter-blog\" \"npm run watch:toc\" \"npm run watch:zenlu\"",
  "start": "concurrently \"npm run watch:css\" \"npm run watch:js\" \"bundle exec jekyll serve\""
}
}
```

#### c. Run the Development Server

Start both the Tailwind CSS and JS watcher and the Jekyll server with:
```bash
npm run start
```
Your site will be accessible at `http://localhost:4000`, and Tailwind CSS will automatically rebuild when you make changes to your CSS files.

#### d. Build the Site
```bash
npm run build
```


## Acknowledgements

Big &#10084; to **ChatGPT** and **Claude** for refining all the code. 
