# Health Care Monitoring System

A full-stack web application for monitoring patient health metrics with AI-powered predictions. Built with Django REST Framework backend and React frontend, containerized with Docker for easy deployment.

## Features

- **Patient Management**: Create, view, and manage patient profiles with detailed health information
- **Health Measurements**: Track and record patient vital signs and health metrics
- **AI Predictions**: Machine learning-based health predictions using trained models
- **User Authentication**: Secure JWT-based authentication for users and patients
- **Responsive Dashboard**: Real-time health data visualization and monitoring
- **RESTful API**: Complete REST API for frontend-backend communication
- **CORS Enabled**: Cross-origin request handling for seamless frontend integration

## Tech Stack

### Backend
- **Framework**: Django 4.2+ with Django REST Framework
- **Authentication**: JWT (djangorestframework-simplejwt)
- **AI/ML**: scikit-learn for machine learning models
- **Database**: MySQL
- **Server**: Gunicorn + Nginx

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router DOM
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS

## Project Structure

```
Backend/
├── apps/
│   ├── users/          # User management & authentication
│   └── healthmonitor/  # Health monitoring features
├── backend/            # Django settings & configuration
├── core/               # AI model integration
├── data/               # Medical training datasets
└── scripts/            # Utility scripts (training, migrations)

Frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components (Dashboard, Login, etc.)
│   └── App.jsx         # Main application component
└── index.html          # Entry HTML file
```

## Quick Start

### Prerequisites
- Python 3.9+ (for local development)
- Node.js 16+ (for frontend development)

### Local Development Setup

**Backend:**
```bash
cd Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend:**
```bash
cd Frontend
npm install
npm run dev
```

## API Endpoints
Read the API documentation file 

## Environment Variables

Create a `.env` file in the Backend directory:

```
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,backend
DATABASE_URL=mysql://user:password@localhost/healthcare_db
JWT_SECRET=your-jwt-secret
```

## Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License - feel free to use this project for learning and development purposes.
