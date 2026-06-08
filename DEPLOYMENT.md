# Deployment

This project is deployed to AWS as a single zip artifact. The Angular frontend is built and bundled into the Node backend, then both are zipped together and uploaded.

## Prerequisites

- Node.js and npm installed
- Angular CLI available (via `npx` or globally)
- Access to the AWS environment used to host the app

## Steps

1. **Build the Angular frontend**

   From the `Upay-angular/` directory:

   ```bash
   cd Upay-angular
   npm install
   npm run build
   ```

   This produces a build output folder (typically `dist/` or a named `angular/` folder per the project's Angular config).

2. **Copy the Angular build into the Node project**

   Copy the built Angular output folder into `Upay-node/` and name it `angular/`:

   ```
   Upay-node/
   ├── angular/        <-- copied Angular build output
   ├── app.js
   ├── server.js
   ├── package.json
   ├── controllers/
   ├── middleware/
   ├── models/
   └── routes/
   ```

3. **Create the deployment zip**

   From inside `Upay-node/`, create a zip containing exactly these entries:

   - `angular/`
   - `controllers/`
   - `middleware/`
   - `models/`
   - `routes/`
   - `app.js`
   - `server.js`
   - `package.json`

   Example:

   ```bash
   cd Upay-node
   zip -r upay-deploy.zip angular controllers middleware models routes app.js server.js package.json
   ```

   Do **not** include `node_modules/` — AWS will install dependencies from `package.json`.

4. **Upload to AWS**

   Upload `upay-deploy.zip` to the configured AWS deployment target.

## Notes

- The Node server serves the Angular build as static assets, so the frontend and backend ship together as one artifact.
- If the Angular build output folder is named something other than `angular/` (e.g. `dist/upay-angular/`), rename it to `angular/` before zipping so the backend's static-file paths resolve correctly.
