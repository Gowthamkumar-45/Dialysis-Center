# Dialysis Center Management System

A full-stack clinical management portal designed for dialysis centers.

## Project Structure

- **Frontend**: React.js based administrative dashboard.
- **Backend**: Django REST Framework API.

## Features

- **Patient Management**: Clinical profiles, treatment history, and demographic tracking.
- **Scheduling**: Real-time appointment booking with machine allocation logic.
- **Machine Monitoring**: Status tracking for dialysis units.
- **Clinical Reporting**: Post-dialysis session summaries and outcome tracking.
- **Staff Management**: Role-based access and clinician assignments.

## Setup Instructions

### Backend
1. Navigate to `backend/`
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `source venv/bin/activate`
4. Install dependencies: `pip install django djangorestframework django-cors-headers`
5. Run migrations: `python manage.py migrate`
6. Start server: `python manage.py runserver`

### Frontend
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Start development server: `npm start`
