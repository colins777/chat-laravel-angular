Project: Laravel + Angular
This repository contains a Laravel backend in the backend folder and an Angular frontend in the frontend folder. Below you will find instructions for local project setup and deployment.

Requirements
PHP >= 8.1

Composer
Node.js >= 16.x and npm

MySQL
Angular CLI

##Clone the Project
gh repo clone colins777/chat-laravel-angular



##Running the Backend (Laravel) – backend folder
Go to the backend folder:
cd backend

##Install dependencies:
```bash
composer install
```
Create the .env file and configure your database settings:

Edit the .env file to set DB_DATABASE, DB_USERNAME, DB_PASSWORD, etc.

##Generate application key:
```bash
php artisan key:generate
```

##Run migrations:
```bash
php artisan migrate --seed
```

##Run seeders
```bash
php artisan migrate --seed
```

##add avatars to users
```bash
php artisan db:seed --class=AddAvatarsToUsersSeeder
```

##Start the backend server:
```bash
php artisan serve
```
The server will run at http://localhost:8000


##Change password for test user (Example)
```bash
php artisan user:change-password user@example.com 123456
```

##Run reverb server
```bash
php artisan reverb:start 
```

##Run reverb server --debug mode
```bash
php artisan reverb:start --debug
```

##Clear Laravel cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

##Running the Frontend (Angular) – frontend folder
Go to the frontend folder: cd frontend

##Install dependencies:
```bash
npm install
```

##Start the Angular server:
```bash
ng serve
```
The application will be available at http://localhost:4200

##clear Angular cache
```bash
ng cache clean
```

##Go to login page - http://localhost:4200/login -> redirect to http://localhost:4200/chat

