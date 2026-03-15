#!/bin/bash
echo "Starting Noir Barber System..."
(cd server && npx nodemon index.js) &
(cd client && npm run dev) &
echo "Backend and Frontend are starting..."
wait
