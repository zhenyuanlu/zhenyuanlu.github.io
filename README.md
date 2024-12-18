# ZenLu  Jekyll Theme

Well, this is a Jekyll theme that I actually have created for my own page, courses and educational website working with ChatGPT and claude. I named it **Zenlu** as an scientific, and educational theme. If you like it feel free to use it.

This theme heavily built on Tailwind CSS styling. 

# Features, Tasks and Bugs

## TODO:

### &#128029; Bugs
- [ ] Fix Navbar underline appearing when refreshing the page 
- [ ] Fix reference styling 
- [ ] Fix blog styling 
- [ ] Fix dark mode issues 


### &#10024; Features
- [ ] Improve the navigation bar design 
- [ ] Add overwidth image handling 


###  &#128736; Tasks
- [ ] Refactor the code 


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
