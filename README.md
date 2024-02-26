<p align="center">
	<img alt="h-blog" src="https://github.com/huanghanzhilian/huanghanzhilian/raw/main/projects/h-blog.png" width="300">
</p>
<h1 align="center" style="margin: 30px 0 30px; font-weight: bold;">H-BLOG</h1>


<h4 align="center">A Lightweight Blog System Based on Node.js and Express.js, Compatible with Desktop, Tablet, and Phone</h4>

## README.md
- en [English](README.md)
- zh_CN [Simplified Chinese](README.zh_CN.md)

## Preface

`h-blog` is a lightweight blog system, supporting responsive interaction, with elegant interface, rich features, compact and fast, comprehensive functionality, and beautiful design.

Hope visitors can gain something. The story doesn't end, and youth doesn't fade.

## Project Online Demo

**Project Online Demo:**

Deployment Address: [https://blog.huanghanlian.com/](https://blog.huanghanlian.com/)

Project GitHub: [https://github.com/huanghanzhilian/h-blog](https://github.com/huanghanzhilian/h-blog)

## Directory Structure

The purpose of each file and folder:

1. `models`: Stores files for database operations
2. `public`: Stores static files such as styles, images, etc.
3. `routes`: Stores route files
4. `views`: Stores template files
5. `index.js`: Main program file
6. `package.json`: Stores project name, description, author, dependencies, etc.

## Install Dependencies

Purposes of corresponding modules:

1. `express`: Web framework
2. `ejs`: Template
3. `mongoose`: MongoDB object modeling designed to work in an asynchronous environment
4. `markdown-it`: Editor conversion
5. `body-parser`: Formats data from forms
6. `multer`: Image upload component for forms based on multipart/form-data type
7. `underscore`: `_.extend` replaces fields in the old object with fields in the new object
8. `moment`: Time formatting
9. `express-session`: Session middleware
10. `connect-mongo`: Stores session in mongodb, used in conjunction with express-session
11. `config-lite`: Reads configuration files

## Configuration File

config/default.js

```javascript
module.exports = {
  port: 3001,
  session: {
    secret: 'h-blog',
    key: 'h-blog',
    maxAge: 2592000000
  },
  mongodb: 'mongodb://localhost:27017/h-blog'
}
```

Configuration interpretation:

1. `port`: Port number the program listens on when starting
2. `session`: Configuration information for express-session
3. `mongodb`: MongoDB address, starting with mongodb:// protocol, with h-blog as the db name

## Feature Design and Route Design

**Blog Frontend**

- Login
    1. Login Page: GET /signin
    2. Login: POST /user/signin
- Registration Page
    1. Registration Page: GET /signup
    2. Registration: POST /user/signup
- Article List Page
- Article Detail Page

