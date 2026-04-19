Document 2: Technical Specification
1. Introduction

This document provides the detailed technical specifications for the REST API and data schema of the freelance platform. It is intended for the engineering team to use as a guide for development. Authentication will be handled via JWT (JSON Web Tokens). Endpoints marked as Protected require a valid token in the Authorization: Bearer <token> header.

2. Data Schema

The database will be structured around the following entities. The primary key for all entities will be a UUID.

**Users**

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary Key | Unique identifier for the user. |
| email | VARCHAR(255) | Unique, Not Null | User's email address for login. |
| password_hash | VARCHAR(255) | Not Null | Hashed user password. |
| user_type | ENUM | Not Null | Role: 'freelancer', 'company', 'admin'. |

**FreelancerProfiles**
| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary Key | Profile's unique identifier. |
| user_id | UUID | Foreign Key (Users.id) | Links to the Users table. |
| first_name | VARCHAR(255) | | Freelancer's first name. |
| last_name | VARCHAR(255) | | Freelancer's last name. |
| phone_number| VARCHAR(50) | | Contact phone number. |
| nationality | VARCHAR(100) | | Freelancer's nationality. |
| daily_rate | DECIMAL | | Freelancer's daily rate. |
| operating_cities| JSONB | | Array of cities or "Remote". Ex: ["Paris", "Remote"] |
| cv_url | VARCHAR(255) | | URL to the stored CV file. |
| is_available | BOOLEAN | Default: true | Availability status. |
| is_approved | BOOLEAN | Default: false | Admin approval status. |
| portage_company_id | UUID | Foreign Key (PortageCompanies.id)| Optional link to a portage company. |

**CompanyProfiles**
| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary Key | Profile's unique identifier. |
| user_id | UUID | Foreign Key (Users.id) | Links to the Users table. |
| company_name| VARCHAR(255) | Not Null | Legal name of the company. |
| contact_first_name| VARCHAR(255) | | First name of the contact. |
| contact_last_name| VARCHAR(255) | | Last name of the contact. |
| contact_phone_number | VARCHAR(50) | | Optional phone number for the contact. |

**Missions**
| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary Key | Unique identifier for the mission. |
| company_id | UUID | Foreign Key (CompanyProfiles.id) | Posting company. |
| assigned_freelancer_id| UUID | Foreign Key (FreelancerProfiles.id) | Assigned freelancer. |
| title | VARCHAR(255) | Not Null | Mission title. |
| description | TEXT | | Detailed description. |
| location | VARCHAR(255) | | Required mission location. |
| status | ENUM | Not Null | 'open', 'ongoing', 'finished'. |

**Interviews**
| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary Key | Unique identifier for the interview. |
| company_id | UUID | Foreign Key (CompanyProfiles.id) | Interviewing company. |
| freelancer_id| UUID | Foreign Key (FreelancerProfiles.id) | Interviewed freelancer. |
| interview_datetime | TIMESTAMP | Not Null | Scheduled date and time. |
| status | ENUM | Not Null | 'scheduled', 'past', 'cancelled'. |

Join Tables (Many-to-Many) and other tables like Skills, Categories, Industries, Chats, Messages, Ratings, etc., are defined as in the previous version.

3. REST API Endpoints Specification

**Authentication & Onboarding Endpoints**

* POST /api/register

    * Description: Creates a new user account.

    * Auth: Public

    * Body: { "email": "string", "password": "string", "userType": "enum('freelancer', 'company')" }

    * Success Response: 201 Created with { "userId": "uuid", "message": "User created successfully" }

* POST /api/login

    * Description: Authenticates a user and returns a token.

    * Auth: Public

    * Body: { "email": "string", "password": "string" }

    * Success Response: 200 OK with { "token": "string", "userType": "string" }

* POST /api/logout

    * Description: Logs the user out (can be implemented by invalidating the token on the server-side if using a blacklist).

    * Auth: Protected (All roles)

    * Success Response: 204 No Content

* POST /api/onboarding/freelancer/step1

    * Description: Submits a freelancer's basic info.

    * Auth: Protected (Freelancer)

    * Body: { "firstName": "string", "lastName": "string", "phoneNumber": "string", "nationality": "string", "dailyRate": number, "operating_cities": ["string"] }

    * Success Response: 200 OK with { "message": "Step 1 completed" }

* POST /api/onboarding/freelancer/step2

    * Description: Submits a freelancer's skills and industry.

    * Auth: Protected (Freelancer)

    * Body: { "skillIds": ["uuid"], "industryId": "uuid" }

    * Success Response: 200 OK with { "message": "Step 2 completed" }

* POST /api/onboarding/freelancer/cv

    * Description: Uploads a freelancer's CV.

    * Auth: Protected (Freelancer)

    * Request: multipart/form-data with a file field named cv.

    * Success Response: 200 OK with { "cvUrl": "string", "message": "CV uploaded successfully" }

* POST /api/onboarding/company

    * Description: Submits a company's onboarding info.

    * Auth: Protected (Company)

    * Body: { "companyName": "string", "contactFirstName": "string", "contactLastName": "string", "contactPhoneNumber": "string" (optional), "industryId": "uuid" }

    * Success Response: 200 OK with { "message": "Onboarding completed" }

**Company-Side Endpoints**

* GET /api/freelancers

    * Description: Retrieves a list of approved freelancers with filters.

    * Auth: Protected (Company)

    * Query Params: skills (comma-separated UUIDs), category (UUID), isAvailable (boolean), dailyRateLte (number), dailyRateGte (number), location (string).

    * Success Response: 200 OK with a list of freelancer profiles.

* GET /api/freelancers/{freelancerId}

    * Description: Retrieves a specific freelancer's detailed profile.

    * Auth: Protected (Company)

    * Success Response: 200 OK with the full freelancer profile object.

* GET /api/company/profile

    * Description: Retrieves the current company's profile.

    * Auth: Protected (Company)

    * Success Response: 200 OK with the company profile object.

* PUT /api/company/profile

    * Description: Updates the current company's profile.

    * Auth: Protected (Company)

    * Body: { "companyName": "string", "contactFirstName": "string", ... }

    * Success Response: 200 OK with the updated company profile.

* DELETE /api/company/profile

    * Description: Deletes the company's account.

    * Auth: Protected (Company)

    * Success Response: 204 No Content

* POST /api/missions

    * Description: Creates a new job offer (mission).

    * Auth: Protected (Company)

    * Body: { "title": "string", "description": "text", "location": "string", "requiredSkillIds": ["uuid"] }

    * Success Response: 201 Created with the new mission object.

* GET /api/company/missions

    * Description: Retrieves missions created by the company.

    * Auth: Protected (Company)

    * Query Params: status ('open', 'ongoing', 'finished').

    * Success Response: 200 OK with a list of mission objects.

* PUT /api/missions/{missionId}/finish

    * Description: Marks a mission as finished.

    * Auth: Protected (Company)

    * Success Response: 200 OK with the updated mission object.

* POST /api/missions/{missionId}/rate-freelancer

    * Description: Rates a freelancer for a completed mission.

    * Auth: Protected (Company)

    * Body: { "ratingScore": integer (1-5), "comment": "text" }

    * Success Response: 201 Created with the new rating object.

* POST /api/company/availability-slots

    * Description: Creates available time slots for interviews.

    * Auth: Protected (Company)

    * Body: { "slots": ["YYYY-MM-DDTHH:MM:SSZ", "YYYY-MM-DDTHH:MM:SSZ"] }

    * Success Response: 201 Created

* GET /api/company/availability-slots

    * Description: Retrieves the company's created availability slots.

    * Auth: Protected (Company)

    * Success Response: 200 OK with a list of slot objects.

**Freelancer-Side Endpoints**

* GET /api/missions

    * Description: Retrieves all open missions (job offers) with filters.

    * Auth: Protected (Freelancer)

    * Query Params: keywords (string), location (string), skills (comma-separated UUIDs).

    * Success Response: 200 OK with a list of open missions.

* GET /api/missions/{missionId}

    * Description: Retrieves details for a specific mission.

    * Auth: Protected (Freelancer)

    * Success Response: 200 OK with the mission object.

* GET /api/freelancer/profile

    * Description: Retrieves the current freelancer's profile.

    * Auth: Protected (Freelancer)

    * Success Response: 200 OK with the freelancer profile object.

* PUT /api/freelancer/profile

    * Description: Updates the current freelancer's profile.

    * Auth: Protected (Freelancer)

    * Body: { "firstName": "string", "dailyRate": number, ... }

    * Success Response: 200 OK with the updated freelancer profile.

* DELETE /api/freelancer/profile

    * Description: Deletes the freelancer's account.

    * Auth: Protected (Freelancer)

    * Success Response: 204 No Content

* PUT /api/freelancer/availability

    * Description: Toggles the freelancer's availability status.

    * Auth: Protected (Freelancer)

    * Body: { "isAvailable": boolean }

    * Success Response: 200 OK

* GET /api/freelancer/missions

    * Description: Retrieves missions the freelancer is assigned to.

    * Auth: Protected (Freelancer)

    * Query Params: status ('ongoing', 'finished').

    * Success Response: 200 OK with a list of mission objects.

* POST /api/missions/{missionId}/rate-company

    * Description: Rates a company for a completed mission.

    * Auth: Protected (Freelancer)

    * Body: { "ratingScore": integer (1-5), "comment": "text" }

    Success Response: 201 Created with the new rating object.

**Shared Endpoints (Interviews & Chat)**

* POST /api/interviews

    * Description: Schedule a new interview. Typically initiated by a company.

    * Auth: Protected (Company)

    * Body: { "freelancerId": "uuid", "interviewDatetime": "YYYY-MM-DDTHH:MM:SSZ" }

    * Success Response: 201 Created with the new interview object.

* GET /api/interviews

    * Description: Retrieves interviews for the authenticated user.

    * Auth: Protected (Company or Freelancer)

    * Query Params: view ('today', 'upcoming', 'past').

    * Success Response: 200 OK with a list of interview objects.

* PUT /api/interviews/{interviewId}

    * Description: Reschedules an upcoming interview.

    * Auth: Protected (Company or Freelancer)

    * Body: { "interviewDatetime": "YYYY-MM-DDTHH:MM:SSZ" }

    * Success Response: 200 OK with the updated interview object.

* DELETE /api/interviews/{interviewId}

    * Description: Cancels an upcoming interview. Cannot be used on the day of the interview.

    * Auth: Protected (Company or Freelancer)

    * Success Response: 204 No Content

* POST /api/chats

    * Description: Initiates a new chat conversation with a user.

    * Auth: Protected (Company or Freelancer)

    * Body: { "recipientId": "uuid" }

    * Success Response: 201 Created with the new chat object including participants.

* GET /api/chats

    * Description: Retrieves all chat conversations for the authenticated user.

    * Auth: Protected (Company or Freelancer)

    * Success Response: 200 OK with a list of chat objects.

* POST /api/chats/{chatId}/messages

    * Description: Sends a message in a specific chat.

    * Auth: Protected (Chat Participant)

    * Body: { "content": "text" }

    * Success Response: 201 Created with the new message object.

**Back-Office Admin Endpoints**

Freelancer Management:

* GET /api/admin/freelancers: List all freelancers with filters (isApproved).

* GET /api/admin/freelancers/{id}: Get a single freelancer by ID.

* PUT /api/admin/freelancers/{id}: Update any detail of a freelancer's profile.

* DELETE /api/admin/freelancers/{id}: Delete a freelancer.

* PUT /api/admin/freelancers/{id}/approve: Sets is_approved to true.

* PUT /api/admin/freelancers/{id}/assign-portage: Assign a portage company. Body: { "portageCompanyId": "uuid" }.

Company Management:

* GET /api/admin/companies: List all companies.

* GET /api/admin/companies/{id}: Get a single company by ID.

* POST /api/admin/companies: Create a new company profile.

* PUT /api/admin/companies/{id}: Update a company profile.

* DELETE /api/admin/companies/{id}: Delete a company.

Taxonomy Management (Skills, Categories, Industries):

* GET /api/admin/skills, POST /api/admin/skills (Body: { "name": "string", "categoryId": "uuid" }), PUT /api/admin/skills/{id}, DELETE /api/admin/skills/{id}

* GET /api/admin/categories, POST /api/admin/categories (Body: { "name": "string" }), PUT /api/admin/categories/{id}, DELETE /api/admin/categories/{id}

* GET /api/admin/industries, POST /api/admin/industries (Body: { "name": "string" }), PUT /api/admin/industries/{id}, DELETE /api/admin/industries/{id}

Other Admin Endpoints:

* GET /api/admin/collaborations: View all signed contracts.

* GET /api/admin/interviews: View and manage all interviews.

* GET, POST, PUT, DELETE /api/admin/portage-companies: Full CRUD for portage companies.