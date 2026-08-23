# Therapy House Hotspot And Content Map

This map documents the current clickable surfaces in `assets/scripts/content-data.js`.

## Behaviour Rules

- Exterior hotspots open an interior room.
- A reading page can open a room directly: `/house/?room=<id>` skips the exterior and walks in, and `&from=<path>` is where the "Back to the website" control points. Unknown ids fall through to the exterior.
- Interior hotspots with `action: "content"` open the warm content modal, unless they also have a `targetRoom`; in that case they navigate to the target room.
- `action: "about"` opens the team carousel.
- `action: "philosophy"` opens the philosophy modal.
- `action: "contact"` opens the full contact modal.
- `action: "back"` returns to the exterior turntable.

## Exterior Turntable Hotspots

| Hotspot ID | Visible Label | Exterior Feature | Assigned Room | Content Key | Content Summary |
| --- | --- | --- | --- | --- | --- |
| `main-door` | Main Door | front door | `welcome` | `rooms.welcome` | Welcome Room entry content and intro. |
| `services-window` | Services | right services window | `services` | `rooms.services` | Consulting Room summary and services pathway. |
| `group-window` | Group Therapy | upper group therapy window/sign | `groups` | `rooms.groups` | Group Room summary and program pathway. |
| `blogs-sign` | Library | left blogs sign / tower window | `library` | `rooms.library` | Library/resource hub summary. |
| `team-sign` | Team | team garden sign | `team` | `rooms.team` | Team Parlour summary and staff pathway. |
| `mailbox` | Contact | mailbox | `contact` | `rooms.contact` | Reception/contact summary. |
| `staff-side-door` | Work With Us | side door / staff noticeboard | `work-with-us` | `rooms.work-with-us` | Work With Us summary. |

## Room Content And Hotspots

### `welcome` - Welcome Room

Background assets:

- `assets/media/inside-layer-1.webp`
- `assets/media/inside-layer-2.webp`
- `assets/media/inside-layer-3.webp`

Room content:

- Warm entry point for the main Therapy House story, philosophy, team and contact paths.
- Intro copy: Therapy House as a boutique psychology clinic in a leafy Brisbane suburb, designed to feel at home.

| Hotspot ID | Visible Label | Behaviour | Target Room | Content Key | Content Opened |
| --- | --- | --- | --- | --- | --- |
| `about` | About Us | Opens team carousel | `team` configured, but carousel action takes priority | `team` | Team members, availability and therapy dogs are the source content. |
| `philosophy` | Our Philosophy | Opens philosophy modal | - | `philosophy` | Our Philosophy intro, principles and closing copy. |
| `contact` | Contact Us | Opens full contact modal | `contact` configured, but contact action takes priority | `contact` | Phone, fax, email, address, booking link and clinic/parking intro. |
| `back` | Back | Returns to exterior | `exterior` by behaviour | `rooms.exterior` | Exterior summary. |

### `team` - Team Parlour

Background asset:

- `assets/rooms/team-parlour.webp`

Room content:

- Staff profiles, availability notes and team biographies in a carousel-friendly structure.
- Uses the current team list from the scraped site.

| Hotspot ID | Visible Label | Behaviour | Target Room | Content Key | Content Opened |
| --- | --- | --- | --- | --- | --- |
| `team-carousel` | Meet The Team | Opens team carousel | - | `team.members` | 12 team profiles. |
| `availability` | Availability | Opens content modal | - | `team.availability` | 8 availability records. |
| `therapy-dogs` | Therapy Dogs | Opens content modal | - | `team.dogs` | Reea and Samson. |
| `back` | Back | Returns to exterior | `exterior` by behaviour | - | No content modal. |

### `services` - Consulting Room

Background asset:

- `assets/rooms/consulting-room.webp`

Room content:

- Core therapy services, therapy models, fees, rebates, assessment fees and practical appointment information.

| Hotspot ID | Visible Label | Behaviour | Target Room | Content Key | Content Opened |
| --- | --- | --- | --- | --- | --- |
| `service-list` | Services | Opens content modal | - | `services.offerings` | 8 service offerings. |
| `therapy-models` | Therapy Models | Opens content modal | - | `services.therapyModels` | 5 therapy model descriptions. |
| `fees` | Fees | Opens content modal | - | `services.fees` | 7 fee records. |
| `rebates` | Rebates | Opens content modal | - | `services.rebates` | Medicare and private health rebate notes. |
| `reports` | Reports | Opens content modal | - | `services.reports` | Report and letter fee notes. |
| `assessment-room` | Assessments | Navigates to room | `assessments` | `rooms.assessments` | Assessment Room summary is configured, but navigation takes priority. |
| `back` | Back | Returns to exterior | `exterior` by behaviour | - | No content modal. |

### `assessments` - Assessment Room

Background asset:

- `assets/rooms/assessment-room.webp`

Room content:

- Assessment process, required documentation, assessment packages and FAQ content.

| Hotspot ID | Visible Label | Behaviour | Target Room | Content Key | Content Opened |
| --- | --- | --- | --- | --- | --- |
| `assessment-process` | Process | Opens content modal | - | `assessments.process` | 8-step assessment process. |
| `assessment-documents` | Documents | Opens content modal | - | `assessments.documents` | 6 required/background document notes. |
| `psychoeducational-assessment` | Psycho-educational | Opens content modal | - | `assessments.packages.psychoeducational` | Comprehensive Psycho-educational Assessment, price and inclusions. |
| `cognitive-assessment` | Cognitive | Opens content modal | - | `assessments.packages.cognitive` | Cognitive Assessment, price and description. |
| `adhd-assessment` | ADHD | Opens content modal | - | `assessments.packages.adhd` | ADHD Assessment, price and description. |
| `autism-assessment` | Autism | Opens content modal | - | `assessments.packages.autism` | Autism Assessment, price and description. |
| `school-observations` | School Observations | Opens content modal | - | `assessments.schoolObservations` | School observation add-on, price and description. |
| `assessment-faq` | FAQ | Opens content modal | - | `assessments.faq` | 4 assessment FAQ notes. |
| `back` | Back | Returns to exterior | `exterior` by behaviour | - | No content modal. |

### `groups` - Group Room

Background asset:

- `assets/rooms/group-room.webp`

Room content:

- Group therapy programs, Circle of Security Parenting and workshop/seminar expression-of-interest content.

| Hotspot ID | Visible Label | Behaviour | Target Room | Content Key | Content Opened |
| --- | --- | --- | --- | --- | --- |
| `group-overview` | Group Therapy | Opens content modal | - | `groups.overview` | 3 group therapy overview notes. |
| `emotion-regulation` | Emotion Regulation | Opens content modal | - | `groups.programs.emotionRegulation` | Emotion Regulation and Social Skills Workshop. |
| `hunter-remote` | Hunter's Remote | Opens content modal | - | `groups.programs.hunterRemote` | Hunter and His Amazing Remote Control. |
| `social-relationships` | Social Relationships | Opens content modal | - | `groups.programs.socialRelationships` | Navigating Social Relationships. |
| `lego-club` | Lego Club | Opens content modal | - | `groups.programs.legoClub` | Lego Club. |
| `circle-security` | Circle Of Security | Opens content modal | - | `groups.circleOfSecurity` | Circle of Security Parenting Program. |
| `workshops` | Workshops | Opens content modal | - | `groups.workshops` | Workshop or Seminar Expression of Interest. |
| `back` | Back | Returns to exterior | `exterior` by behaviour | - | No content modal. |

### `library` - Library

Background asset:

- `assets/rooms/library-room.webp`

Room content:

- Resource hub for blogs, products, videos, publications and media appearances.

| Hotspot ID | Visible Label | Behaviour | Target Room | Content Key | Content Opened |
| --- | --- | --- | --- | --- | --- |
| `blogs` | Blogs | Opens content modal | - | `library.blogArticles` | 23 blog/article records with dates, URLs and excerpts. |
| `products` | Books | Opens content modal | - | `library.products` | 2 product/book records. |
| `videos` | Videos | Opens content modal | - | `library.videos` | Video topics and source page. |
| `publications` | Publications | Opens content modal | - | `library.publications` | Publication description and source page. |
| `media` | Media | Opens content modal | - | `library.media` | Media appearance items and source page. |
| `attic` | Our Philosophy | Navigates to target room | `philosophy` | `rooms.philosophy` | Attic reading room summary. |
| `back` | Back | Returns to exterior | `exterior` by behaviour | - | No content modal. |

### `philosophy` - Attic Reading Room

Background asset:

- `assets/rooms/library-attic-room.webp`

Room content:

- The five principles the clinic works to, hung on the objects in the room rather than listed.
- Reached from the library (up the ladder) and directly from the Our Philosophy page, whose hero is a picture of this room.

| Hotspot ID | Visible Label | Behaviour | Target Room | Content Key | Content Opened |
| --- | --- | --- | --- | --- | --- |
| `philosophy-overview` | Our Philosophy | Opens content modal | - | `philosophy` | Intro, closing and all five principles. |
| `holistic-care` | Holistic Care | Opens content modal | - | `philosophy.principles.0` | One principle. |
| `inclusive-environment` | Inclusive Environment | Opens content modal | - | `philosophy.principles.1` | One principle. |
| `sanctuary` | Sanctuary For Wellness | Opens content modal | - | `philosophy.principles.2` | One principle. |
| `meaningful-connections` | Meaningful Connections | Opens content modal | - | `philosophy.principles.3` | One principle. |
| `authenticity` | Authenticity | Opens content modal | - | `philosophy.principles.4` | One principle. |
| `back` | Back | Returns to exterior | `exterior` by behaviour | - | No content modal. |

### `contact` - Reception

Background asset:

- `assets/rooms/reception-room.webp`

Room content:

- Practical contact, booking, parking and location information.

| Hotspot ID | Visible Label | Behaviour | Target Room | Content Key | Content Opened |
| --- | --- | --- | --- | --- | --- |
| `book-online` | Book Online | Opens content modal | - | `contact.bookingUrl` | Power Diary booking link. |
| `phone` | Phone | Opens content modal | - | `contact.phone` | `07 3300 2170`. |
| `email` | Email | Opens content modal | - | `contact.email` | `admin@therapyhouse.com.au`. |
| `address` | Address | Opens content modal | - | `contact.address` | `1290 Waterworks Rd, The Gap, Brisbane, QLD, 4061`. |
| `parking` | Parking | Opens content modal | - | `contact.intro` | 3 clinic location and parking notes. |
| `back` | Back | Returns to exterior | `exterior` by behaviour | - | No content modal. |

### `work-with-us` - Work With Us

Background asset:

- `assets/rooms/work-with-us-room.webp`

Room content:

- Clinic culture, values and work-with-us enquiry content.

| Hotspot ID | Visible Label | Behaviour | Target Room | Content Key | Content Opened |
| --- | --- | --- | --- | --- | --- |
| `opportunities` | Opportunities | Opens content modal | - | `workWithUs.opportunities` | Work-with-us opportunity note. |
| `clinic-culture` | Clinic Culture | Opens content modal | - | `workWithUs.culture` | 2 culture/work environment notes. |
| `values` | Values | Opens content modal | - | `workWithUs.values` | care, compassion, respect. |
| `enquire` | Enquire | Opens content modal | - | `workWithUs.enquiry` | Admin email and source page. |
| `back` | Back | Returns to exterior | `exterior` by behaviour | - | No content modal. |

## Content Source Inventory

| Content Area | Source Key | Contents |
| --- | --- | --- |
| Contact | `contact` | phone, fax, email, address, booking URL, intro text and calls to action. |
| Philosophy | `philosophy` | title, intro, 5 principles and closing copy. |
| Services | `services` | intro, offerings, therapy models, fees, rebates and report notes. |
| Assessments | `assessments` | intro, process, documents, packages, school observations and FAQ. |
| Groups | `groups` | overview, programs, Circle of Security and workshops. |
| Team | `team` | availability, therapy dogs and 12 team member records. |
| Library | `library` | products, videos, publications, media and 23 blog articles. |
| Work With Us | `workWithUs` | values, culture, opportunities and enquiry details. |
