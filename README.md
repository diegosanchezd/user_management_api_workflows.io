# user_management_api_workflows.io

## Project Overview
1. REST API for user management with Node.js, Typescript, Express, and PostgreSQL and Slack Incoming Webhooks.

## Tech Stack
2. Stack
Node - Express - TypeScript - PostgreSQL - Slack Incoming Webhooks

## Prerequisites
3. Prerequisites
Needed to be installed: Node.js, npm and PostgreSQL

## Installation
4. Installation
- Clone GitHub Repo
- Navegate to file /user_management_api
- Execute:
    "npm install"
    "npm run build"
    "npm start"
- Create database "user_management_db"
- Execute Query in /setup/schema.sql
- Create .env using .env.example as a template and fill with values and credentials:
    ## DB ENV AVIRABLES CONFIGURATION
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=user_management_db
    DB_USER=postgres
    DB_PASSWORD=your_postgres_pass
    ## SLACK WEBHOOK URL
    WEBHOOK_URL="https://hooks.slack.com/services/urlExample"
    
- Initialize app using the script defined in package.json

## API Endpoints
5. API Endpoints
GET	/health	Check API and database availability
GET	/users	Get all users
GET	/users/:id	Get an user by ID
POST	/users	Create an user
PATCH	/users/:id	Update an user
DELETE	/users/:id	Delete an user

## API Testing
6. API Testing
A postman collection is included at /setup/user_m_worklfowsio.postman_collection with the examples of the requests. The collection uses baseUrl, must be set with "http://localhost:3000" if the app is running in that port

## Error Handling
7. Error handling:
HTTP	Meaning
200	    Successful operation
201	    Resource created
400	    Invalid input "BAD REQUEST"
404	    NOT FOUND
409	    Conflict - Duplicate email
500	    Internal server error


## Slack Notifications
8. Slack Notifications
When creating, editing, or deleting an user, if the operation is succesfull, it triggers a Slack Notification announcing the operation made and what user affected.

If Slack is not available or deny the request, the error is registered in the sever but the postgres operation is not rolled back