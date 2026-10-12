# Therapy House: rooms, signs and what they open

The illustrated house at `/house/`: which spot on the exterior leads to which
room, and what each sign inside a room opens. The plan behind the current
shape is [docs/house-plan.md](docs/house-plan.md).

## Where things are decided

| What | Where |
| --- | --- |
| Which rooms exist, their pictures, where each sign sits and what it opens | `public/assets/scripts/content-data.js` (developer) |
| Room names, sign wording, picture descriptions | `public/assets/content/house-rooms.json` (CMS: House > Rooms and signs) |
| The words on "read more" links, the rooms menu, the exit link and the screen-reader text | `public/assets/content/house-copy.json` (CMS: House > House text) |
| What a sign's preview says | Built when the site is built, by `src/lib/house-content.js`, from the plain pages' own files: `src/content/pages/`, the team, services, articles and towns, `clinic.json`, `src/data/medicare.js` and the library shelf. Staff edit those pages; the house follows. |

## How a visit moves

- The home page's "Explore the house" opens `/house/` on the exterior. Each hub page's "Step inside" opens `/house/?room=<id>`. `&from=<path>` is where "Back to the website" leads.
- Every move between rooms is a browser history entry, and the address carries `?room=<id>`. The browser's Back button steps back through the rooms.
- A room's Back sign steps back one room. If the visit began in that room, it goes outside.
- The Rooms menu (top right) goes to any room, or outside, from anywhere.
- A sign with a preview opens a pop-up: a sentence or two, a short list, a link to the plain page that holds the full answer, and the booking and calling buttons side by side.
- A package, program or person switched off with "Hidden from the live website" has no preview in a production build, and its sign is left off its room.

## The exterior

The exterior is a 61-frame turntable. Its spots:

| Spot | Words on it | Opens |
| --- | --- | --- |
| `main-door` | Main Door | Welcome Room |
| `services-window` | Services | Consulting Room |
| `group-window` | Group Therapy | Group Room |
| `blogs-sign` | Library | Library |
| `team-sign` | Team | Team Parlour |
| `mailbox` | Contact | Welcome Room |
| `staff-side-door` | Work With Us | Work With Us |

## Room: `welcome`: Welcome Room

The front room, and reception too: reception was a room of its own until
it joined this one (see "One front room" in docs/house-plan.md). An old
`?room=contact` address still walks in here.

| Sign | Words on it | Opens |
| --- | --- | --- |
| `about` | About Us | the team carousel |
| `philosophy` | Our Philosophy | Attic Reading Room |
| `contact` | Book or call | the contact pop-up: booking and calling, phone, email, address |
| `find-us` | Find us | preview `contact.findUs` (address and parking), then Google Maps |
| `telehealth` | See us by video | Telehealth Room |
| `back` | Back | one step back (outside, if the visit began here) |

## Room: `team`: Team Parlour

| Sign | Words on it | Opens |
| --- | --- | --- |
| `team-carousel` | Meet The Team | the team carousel |
| `availability` | Availability | preview `team.availability`, then /team/ |
| `therapy-dogs` | Therapy Dogs | preview `team.dogs`, then /team/ |
| `back` | Back | one step back (outside, if the visit began here) |

## Room: `services`: Consulting Room

| Sign | Words on it | Opens |
| --- | --- | --- |
| `service-list` | Services | preview `services.offerings`, then /therapy/ |
| `therapy-models` | Therapy Models | preview `services.therapyModels`, then /therapy/approaches/ |
| `fees` | Fees | preview `services.fees`, then /fees/ |
| `rebates` | Rebates | preview `services.rebates`, then /fees/ |
| `reports` | Reports | preview `services.reports`, then /fees/ |
| `assessment-room` | Assessments | Assessment Room |
| `back` | Back | one step back (outside, if the visit began here) |

## Room: `assessments`: Assessment Room

| Sign | Words on it | Opens |
| --- | --- | --- |
| `assessment-process` | Process | preview `assessments.process`, then /assessments/ |
| `assessment-documents` | Documents | preview `assessments.documents`, then /assessments/ |
| `psychoeducational-assessment` | Psycho-educational | preview `assessments.packages.psychoeducational`, then /assessments/ |
| `cognitive-assessment` | Cognitive | preview `assessments.packages.cognitive`, then /assessments/ |
| `adhd-assessment` | ADHD | preview `assessments.packages.adhd`, then /assessments/ |
| `autism-assessment` | Autism | preview `assessments.packages.autism`, then /assessments/ |
| `school-observations` | School Observations | preview `assessments.schoolObservations`, then /assessments/ |
| `assessment-faq` | FAQ | preview `assessments.faq`, then /assessments/ |
| `back` | Back | one step back (outside, if the visit began here) |

## Room: `groups`: Group Room

| Sign | Words on it | Opens |
| --- | --- | --- |
| `group-overview` | Group Therapy | preview `groups.overview`, then /group-therapy/ |
| `emotion-regulation` | Emotion Regulation | preview `groups.programs.emotionRegulation`, then /group-therapy/ |
| `hunter-remote` | Hunter's Remote | preview `groups.programs.hunterRemote`, then /group-therapy/ |
| `social-relationships` | Social Relationships | preview `groups.programs.socialRelationships`, then /group-therapy/ |
| `lego-club` | Lego Club | preview `groups.programs.legoClub`, then /group-therapy/ |
| `circle-security` | Circle Of Security | preview `groups.circleOfSecurity`, then /group-therapy/circle-of-security-parenting-program/ |
| `workshops` | Workshops | preview `groups.workshops`, then /group-therapy/ |
| `back` | Back | one step back (outside, if the visit began here) |

## Room: `library`: Library

| Sign | Words on it | Opens |
| --- | --- | --- |
| `blogs` | Blogs | preview `library.blogArticles`, then /library/ |
| `products` | Books | preview `library.products`, then /library/ |
| `videos` | Videos | preview `library.videos`, then /library/ |
| `publications` | Publications | preview `library.publications`, then /library/ |
| `media` | Media | preview `library.media`, then /library/ |
| `attic` | Our Philosophy | Attic Reading Room |
| `back` | Back | one step back (outside, if the visit began here) |

## Room: `philosophy`: Attic Reading Room

| Sign | Words on it | Opens |
| --- | --- | --- |
| `philosophy-overview` | Our Philosophy | preview `philosophy`, then /philosophy/ |
| `holistic-care` | Holistic Care | preview `philosophy.principles.0`, then /philosophy/ |
| `inclusive-environment` | Inclusive Environment | preview `philosophy.principles.1`, then /philosophy/ |
| `sanctuary` | Sanctuary For Wellness | preview `philosophy.principles.2`, then /philosophy/ |
| `meaningful-connections` | Meaningful Connections | preview `philosophy.principles.3`, then /philosophy/ |
| `authenticity` | Authenticity | preview `philosophy.principles.4`, then /philosophy/ |
| `back` | Back | one step back (outside, if the visit began here) |

## Room: `telehealth`: Telehealth Room

| Sign | Words on it | Opens |
| --- | --- | --- |
| `how-it-works` | How video works | preview `telehealth.process`, then /telehealth/ |
| `medicare` | Medicare | preview `telehealth.medicare`, then /telehealth/#medicare |
| `regional` | Regional Queensland | preview `telehealth.regional`, then /telehealth/ |
| `clinicians` | Who you would see | preview `telehealth.clinicians`, then /telehealth/#who |
| `booking` | Book by video | preview `telehealth.booking`, then /telehealth/#booking |
| `back` | Back | one step back (outside, if the visit began here) |

## Room: `work-with-us`: Work With Us

| Sign | Words on it | Opens |
| --- | --- | --- |
| `opportunities` | Opportunities | preview `workWithUs.opportunities`, then /work-with-us/ |
| `clinic-culture` | Clinic Culture | preview `workWithUs.culture`, then /work-with-us/ |
| `values` | Values | preview `workWithUs.values`, then /work-with-us/ |
| `enquire` | Enquire | preview `workWithUs.enquiry`, then mailto:admin@therapyhouse.com.au |
| `back` | Back | one step back (outside, if the visit began here) |
