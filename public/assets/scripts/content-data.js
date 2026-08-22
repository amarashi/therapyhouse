export const roomIds = ["exterior", "welcome", "team", "services", "assessments", "groups", "library", "contact", "work-with-us"];

export const roomNavigation = {
  initialRoomId: "exterior",
  defaultInteriorRoomId: "welcome",
  roomOrder: roomIds,
  rooms: {
    exterior: {
      id: "exterior",
      title: "Exterior",
      type: "turntable",
      label: "Therapy House exterior",
      description: "The rotating house scene that acts as the main site map.",
      entryPoint: "turntable",
      route: "#exterior"
    },
    welcome: {
      id: "welcome",
      title: "Welcome Room",
      type: "interior",
      label: "Welcome",
      exteriorEntry: "Main door",
      route: "#welcome"
    },
    team: {
      id: "team",
      title: "Team Parlour",
      type: "interior",
      label: "Team",
      exteriorEntry: "Team garden sign",
      route: "#team"
    },
    services: {
      id: "services",
      title: "Consulting Room",
      type: "interior",
      label: "Services",
      exteriorEntry: "Right services window",
      route: "#services"
    },
    assessments: {
      id: "assessments",
      title: "Assessment Room",
      type: "interior",
      label: "Assessments",
      exteriorEntry: "Smaller side door",
      route: "#assessments"
    },
    groups: {
      id: "groups",
      title: "Group Room",
      type: "interior",
      label: "Group Therapy",
      exteriorEntry: "Upper group therapy window/sign",
      route: "#groups"
    },
    library: {
      id: "library",
      title: "Library",
      type: "interior",
      label: "Library",
      exteriorEntry: "Left blogs sign / tower window",
      route: "#library"
    },
    contact: {
      id: "contact",
      title: "Reception",
      type: "interior",
      label: "Contact",
      exteriorEntry: "Mailbox",
      route: "#contact"
    },
    "work-with-us": {
      id: "work-with-us",
      title: "Work With Us",
      type: "interior",
      label: "Work With Us",
      exteriorEntry: "Side door / staff noticeboard",
      route: "#work-with-us"
    }
  }
};

const roomImageSize = { width: 1672, height: 940 };

const signDefaults = {
  perspective: 900,
  depth: 60,
  rotateX: 0,
  rotateY: 0,
  rotate: 0,
  skewX: 0,
  skewY: 0,
  scale: 0.82,
  scaleX: 1,
  scaleY: 1
};

function hotspot({
  id,
  label,
  action = "content",
  targetRoom = "",
  contentKey = "",
  className = "",
  ariaLabel,
  x,
  y,
  ...position
}) {
  return {
    id,
    label,
    action,
    targetRoom,
    contentKey,
    className,
    ariaLabel: ariaLabel || label,
    position: {
      ...signDefaults,
      x,
      y,
      ...position
    }
  };
}

export const exteriorHotspots = [
  {
    id: "main-door",
    label: "Main Door",
    ariaLabel: "Enter the Therapy House welcome room",
    targetRoom: "welcome",
    exteriorFeature: "front door",
    contentKey: "rooms.welcome",
    position: { x: 0.56, y: 0.53, width: 0.16, height: 0.28, shiftX: -0.14 }
  },
  {
    id: "services-window",
    label: "Services",
    ariaLabel: "Open the Therapy House services consulting room",
    targetRoom: "services",
    exteriorFeature: "right services window",
    contentKey: "rooms.services",
    position: { x: 0.835, y: 0.42, width: 0.19, height: 0.24, shiftX: -0.09 }
  },
  {
    id: "group-window",
    label: "Group Therapy",
    ariaLabel: "Open the Therapy House group therapy room",
    targetRoom: "groups",
    exteriorFeature: "upper group therapy window/sign",
    contentKey: "rooms.groups",
    position: { x: 0.63, y: 0.13, width: 0.22, height: 0.13, shiftX: -0.08 }
  },
  {
    id: "blogs-sign",
    label: "Library",
    ariaLabel: "Open the Therapy House library and resources room",
    targetRoom: "library",
    exteriorFeature: "left blogs sign / tower window",
    contentKey: "rooms.library",
    position: { x: 0.35, y: 0.41, width: 0.18, height: 0.18, shiftX: -0.11 }
  },
  {
    id: "team-sign",
    label: "Team",
    ariaLabel: "Open the Therapy House team parlour",
    targetRoom: "team",
    exteriorFeature: "team garden sign",
    contentKey: "rooms.team",
    position: { x: 0.45, y: 0.72, width: 0.19, height: 0.15, shiftX: -0.12 }
  },
  {
    id: "mailbox",
    label: "Contact",
    ariaLabel: "Open Therapy House contact and reception details",
    targetRoom: "contact",
    exteriorFeature: "mailbox",
    contentKey: "rooms.contact",
    position: { x: 0.835, y: 0.66, width: 0.16, height: 0.22, shiftX: -0.08 }
  },
  {
    id: "staff-side-door",
    label: "Work With Us",
    ariaLabel: "Open the Therapy House work with us room",
    targetRoom: "work-with-us",
    exteriorFeature: "side door / staff noticeboard",
    contentKey: "rooms.work-with-us",
    position: { x: 0.19, y: 0.55, width: 0.12, height: 0.27, shiftX: -0.08 }
  }
];

export const roomSceneDefaults = {
  initialRoomId: "welcome",
  imageSize: roomImageSize,
  rooms: {
    welcome: {
      id: "welcome",
      imageSize: roomImageSize,
      edgeFallbackColors: {
        top: "#34231a",
        right: "#2d211a",
        bottom: "#24170f",
        left: "#31231b"
      },
      parallaxDepths: [
        { x: -3, y: 0 },
        { x: 5, y: 0 },
        { x: 14, y: 1.5 }
      ],
      effects: {
        firelight: true,
        dogEyes: true
      },
      background: {
        layers: [
          {
            src: "assets/media/inside-layer-1.webp",
            className: "inside-parallax__layer--background",
            alt: "Layered illustration of the warm Therapy House clinic interior"
          },
          {
            src: "assets/media/inside-layer-2.webp",
            className: "inside-parallax__layer--middle",
            alt: "Middle layer of the Therapy House counselling room scene"
          },
          {
            src: "assets/media/inside-layer-3.webp",
            className: "inside-parallax__layer--foreground",
            alt: "Foreground layer of the welcoming Therapy House interior"
          }
        ]
      },
      hotspots: [
        hotspot({
          id: "about",
          label: "About Us",
          action: "about",
          targetRoom: "team",
          contentKey: "team",
          className: "scene-sign--table",
          ariaLabel: "Meet the Therapy House team",
          x: 840,
          y: 265,
          scale: 0.78
        }),
        hotspot({
          id: "philosophy",
          label: "Our Philosophy",
          action: "philosophy",
          contentKey: "philosophy",
          className: "scene-sign--wall",
          ariaLabel: "Read the Therapy House philosophy",
          x: 335,
          y: 265,
          perspective: 230,
          rotateY: 35.4,
          rotate: 0.5,
          scale: 0.84
        }),
        hotspot({
          id: "contact",
          label: "Contact Us",
          action: "contact",
          targetRoom: "contact",
          contentKey: "contact",
          className: "scene-sign--notebook",
          ariaLabel: "Contact Therapy House in The Gap",
          x: 1438,
          y: 584,
          perspective: 170,
          depth: 72,
          rotateY: -15.2,
          skewX: 4.1,
          skewY: 32,
          scale: 0.84,
          scaleX: 0.64,
          scaleY: 1.31
        }),
        hotspot({
          id: "back",
          label: "Back",
          action: "back",
          contentKey: "rooms.exterior",
          className: "scene-sign--door",
          ariaLabel: "Return to the Therapy House exterior",
          x: 1337,
          y: 265,
          perspective: 980,
          depth: 128,
          rotateY: -15.2,
          rotate: -1.5,
          scale: 0.74,
          scaleX: 0.71
        })
      ]
    },

    team: {
      id: "team",
      imageSize: roomImageSize,
      background: {
        layers: [
          {
            src: "assets/rooms/team-parlour.webp",
            alt: "Storybook team parlour inside Therapy House"
          }
        ]
      },
      effects: { firelight: false, dogEyes: false },
      hotspots: [
        hotspot({ id: "team-carousel", label: "Meet The Team", action: "about", contentKey: "team.members", x: 1090, y: 122 }),
        hotspot({ id: "availability", label: "Availability", contentKey: "team.availability", x: 1120, y: 315 }),
        hotspot({ id: "therapy-dogs", label: "Therapy Dogs", contentKey: "team.dogs", x: 420, y: 720 }),
        hotspot({ id: "back", label: "Back", action: "back", x: 1450, y: 160 })
      ]
    },

    services: {
      id: "services",
      imageSize: roomImageSize,
      background: {
        layers: [
          {
            src: "assets/rooms/consulting-room.webp",
            alt: "Warm consulting room inside Therapy House"
          }
        ]
      },
      effects: { firelight: false, dogEyes: false },
      hotspots: [
        hotspot({ id: "service-list", label: "Services", contentKey: "services.offerings", x: 1040, y: 360 }),
        hotspot({ id: "therapy-models", label: "Therapy Models", contentKey: "services.therapyModels", x: 1180, y: 230 }),
        hotspot({ id: "fees", label: "Fees", contentKey: "services.fees", x: 1370, y: 610 }),
        hotspot({ id: "rebates", label: "Rebates", contentKey: "services.rebates", x: 1330, y: 760 }),
        hotspot({ id: "reports", label: "Reports", contentKey: "services.reports", x: 1490, y: 465 }),
        hotspot({ id: "assessment-room", label: "Assessments", targetRoom: "assessments", contentKey: "rooms.assessments", x: 650, y: 735 }),
        hotspot({ id: "back", label: "Back", action: "back", x: 170, y: 305 })
      ]
    },

    assessments: {
      id: "assessments",
      imageSize: roomImageSize,
      background: {
        layers: [
          {
            src: "assets/rooms/assessment-room.webp",
            alt: "Child-friendly assessment room inside Therapy House"
          }
        ]
      },
      effects: { firelight: false, dogEyes: false },
      hotspots: [
        hotspot({ id: "assessment-process", label: "Process", contentKey: "assessments.process", x: 1220, y: 405 }),
        hotspot({ id: "assessment-documents", label: "Documents", contentKey: "assessments.documents", x: 1120, y: 720 }),
        hotspot({ id: "psychoeducational-assessment", label: "Psycho-educational", contentKey: "assessments.packages.psychoeducational", x: 560, y: 630 }),
        hotspot({ id: "cognitive-assessment", label: "Cognitive", contentKey: "assessments.packages.cognitive", x: 705, y: 530 }),
        hotspot({ id: "adhd-assessment", label: "ADHD", contentKey: "assessments.packages.adhd", x: 885, y: 570 }),
        hotspot({ id: "autism-assessment", label: "Autism", contentKey: "assessments.packages.autism", x: 1310, y: 785 }),
        hotspot({ id: "school-observations", label: "School Observations", contentKey: "assessments.schoolObservations", x: 1430, y: 710 }),
        hotspot({ id: "assessment-faq", label: "FAQ", contentKey: "assessments.faq", x: 1490, y: 850 }),
        hotspot({ id: "back", label: "Back", action: "back", x: 155, y: 155 })
      ]
    },

    groups: {
      id: "groups",
      imageSize: roomImageSize,
      background: {
        layers: [
          {
            src: "assets/rooms/group-room.webp",
            alt: "Group therapy room inside Therapy House"
          }
        ]
      },
      effects: { firelight: false, dogEyes: false },
      hotspots: [
        hotspot({ id: "group-overview", label: "Group Therapy", contentKey: "groups.overview", x: 835, y: 390 }),
        hotspot({ id: "emotion-regulation", label: "Emotion Regulation", contentKey: "groups.programs.emotionRegulation", x: 710, y: 835 }),
        hotspot({ id: "hunter-remote", label: "Hunter's Remote", contentKey: "groups.programs.hunterRemote", x: 435, y: 835 }),
        hotspot({ id: "social-relationships", label: "Social Relationships", contentKey: "groups.programs.socialRelationships", x: 1110, y: 850 }),
        hotspot({ id: "lego-club", label: "Lego Club", contentKey: "groups.programs.legoClub", x: 835, y: 620 }),
        hotspot({ id: "circle-security", label: "Circle Of Security", contentKey: "groups.circleOfSecurity", x: 1370, y: 830 }),
        hotspot({ id: "workshops", label: "Workshops", contentKey: "groups.workshops", x: 585, y: 300 }),
        hotspot({ id: "back", label: "Back", action: "back", x: 1450, y: 190 })
      ]
    },

    library: {
      id: "library",
      imageSize: roomImageSize,
      background: {
        layers: [
          {
            src: "assets/rooms/library-room.webp",
            alt: "Cosy Therapy House library and resource room"
          }
        ]
      },
      effects: { firelight: false, dogEyes: false },
      hotspots: [
        hotspot({ id: "blogs", label: "Blogs", contentKey: "library.blogArticles", x: 790, y: 720 }),
        hotspot({ id: "products", label: "Books", contentKey: "library.products", x: 1130, y: 560 }),
        hotspot({ id: "videos", label: "Videos", contentKey: "library.videos", x: 835, y: 430 }),
        hotspot({ id: "publications", label: "Publications", contentKey: "library.publications", x: 1240, y: 750 }),
        hotspot({ id: "media", label: "Media", contentKey: "library.media", x: 1450, y: 410 }),
        hotspot({ id: "back", label: "Back", action: "back", x: 180, y: 180 })
      ]
    },

    contact: {
      id: "contact",
      imageSize: roomImageSize,
      background: {
        layers: [
          {
            src: "assets/rooms/reception-room.webp",
            alt: "Therapy House reception room"
          }
        ]
      },
      effects: { firelight: false, dogEyes: false },
      hotspots: [
        hotspot({ id: "book-online", label: "Book Online", contentKey: "contact.bookingUrl", x: 1480, y: 335 }),
        hotspot({ id: "phone", label: "Phone", contentKey: "contact.phone", x: 1410, y: 485 }),
        hotspot({ id: "email", label: "Email", contentKey: "contact.email", x: 940, y: 280 }),
        hotspot({ id: "address", label: "Address", contentKey: "contact.address", x: 880, y: 485 }),
        hotspot({ id: "parking", label: "Parking", contentKey: "contact.intro", x: 290, y: 550 }),
        hotspot({ id: "back", label: "Back", action: "back", x: 180, y: 180 })
      ]
    },

    "work-with-us": {
      id: "work-with-us",
      imageSize: roomImageSize,
      background: {
        layers: [
          {
            src: "assets/rooms/work-with-us-room.webp",
            alt: "Therapy House staff room and work with us noticeboard"
          }
        ]
      },
      effects: { firelight: false, dogEyes: false },
      hotspots: [
        hotspot({ id: "opportunities", label: "Opportunities", contentKey: "workWithUs.opportunities", x: 840, y: 300 }),
        hotspot({ id: "clinic-culture", label: "Clinic Culture", contentKey: "workWithUs.culture", x: 700, y: 560 }),
        hotspot({ id: "values", label: "Values", contentKey: "workWithUs.values", x: 1170, y: 560 }),
        hotspot({ id: "enquire", label: "Enquire", contentKey: "workWithUs.enquiry", x: 1330, y: 365 }),
        hotspot({ id: "back", label: "Back", action: "back", x: 1430, y: 210 })
      ]
    }
  }
};

export const siteContent = {
  source: {
    name: "Therapy House current WordPress site",
    baseUrl: "https://www.therapyhouse.com.au/",
    capturedAt: "2026-05-30T08:32:35.941197+00:00",
    scrape: {
      urlCount: 55,
      pageCount: 34,
      postCount: 23,
      archive: "archive/source_website_contents.md",
      manifest: "archive/live-site-scrape/manifest.json"
    }
  },

  navigation: roomNavigation,

  contact: {
    phone: "07 3300 2170",
    fax: "07 3319 4640",
    email: "admin@therapyhouse.com.au",
    address: "1290 Waterworks Rd, The Gap, Brisbane, QLD, 4061",
    bookingUrl: "https://my.powerdiary.com/clientportal/3cjz0",
    sourceUrl: "https://www.therapyhouse.com.au/contact/",
    intro: [
      "Our clinic is located in a Brisbane Western Suburb, on a main road, yet tucked away so you won't hear any road traffic.",
      "Plenty of street parking, so you don't need to be concerned about finding a park.",
      "Our clients are from anywhere in the greater Brisbane area."
    ],
    callsToAction: [
      { label: "Book an appointment online", url: "https://my.powerdiary.com/clientportal/3cjz0" },
      { label: "Call Therapy House", url: "tel:+61733002170" },
      { label: "Email reception", url: "mailto:admin@therapyhouse.com.au" }
    ]
  },

  rooms: {
    exterior: {
      id: "exterior",
      title: "Exterior",
      summary: "The rotating Therapy House exterior is the top-level navigation surface for the expanded site.",
      hotspots: exteriorHotspots
    },

    welcome: {
      id: "welcome",
      title: "Welcome Room",
      exteriorEntry: "Main door",
      sourceUrls: ["https://www.therapyhouse.com.au/"],
      summary: "A warm entry point for the main Therapy House story, philosophy, team and contact paths.",
      intro: [
        "Therapy House is a place for all children, and anyone who has once been a child.",
        "Therapy House is a boutique psychology clinic for people of all ages.",
        "Located in a leafy suburb of Brisbane, the space is purposefully and elegantly designed to make people feel at home."
      ],
      hotspots: [
        { id: "about-team", label: "About Us", targetRoom: "team", contentKey: "team" },
        { id: "philosophy", label: "Our Philosophy", contentKey: "philosophy" },
        { id: "contact", label: "Contact Us", targetRoom: "contact", contentKey: "contact" },
        { id: "explore-house", label: "Explore The House", targetRoom: "exterior", contentKey: "roomGuide" }
      ]
    },

    team: {
      id: "team",
      title: "Team Parlour",
      exteriorEntry: "Team garden sign",
      sourceUrls: [
        "https://www.therapyhouse.com.au/about/",
        "https://www.therapyhouse.com.au/staff-sitemap.xml"
      ],
      summary: "Staff profiles, availability notes and team biographies in a carousel-friendly structure.",
      hotspots: [
        { id: "team-carousel", label: "Meet The Team", contentKey: "team.members" },
        { id: "availability", label: "Availability", contentKey: "team.availability" },
        { id: "therapy-dogs", label: "Therapy Dogs", contentKey: "team.dogs" }
      ]
    },

    services: {
      id: "services",
      title: "Consulting Room",
      exteriorEntry: "Right services window",
      sourceUrls: ["https://www.therapyhouse.com.au/services/"],
      summary: "Core therapy services, therapy models, fees, rebates, assessment fees and practical appointment information.",
      hotspots: [
        { id: "service-list", label: "Services", contentKey: "services.offerings" },
        { id: "therapy-models", label: "Therapy Models", contentKey: "services.therapyModels" },
        { id: "fees", label: "Fees", contentKey: "services.fees" },
        { id: "rebates", label: "Rebates", contentKey: "services.rebates" },
        { id: "reports", label: "Reports", contentKey: "services.reports" },
        { id: "assessment-room", label: "Assessments", targetRoom: "assessments", contentKey: "rooms.assessments" }
      ]
    },

    assessments: {
      id: "assessments",
      title: "Assessment Room",
      exteriorEntry: "Smaller side door",
      sourceUrls: [
        "https://www.therapyhouse.com.au/assessments/",
        "https://www.therapyhouse.com.au/assessments/what-is-adhd/",
        "https://www.therapyhouse.com.au/assessments/is-your-child-learning-to-the-best-of-their-capacity/"
      ],
      summary: "Assessment process, required documentation, assessment packages and FAQ content.",
      hotspots: [
        { id: "assessment-process", label: "Process", contentKey: "assessments.process" },
        { id: "assessment-documents", label: "Documents", contentKey: "assessments.documents" },
        { id: "psychoeducational-assessment", label: "Psycho-educational", contentKey: "assessments.packages.psychoeducational" },
        { id: "cognitive-assessment", label: "Cognitive", contentKey: "assessments.packages.cognitive" },
        { id: "adhd-assessment", label: "ADHD", contentKey: "assessments.packages.adhd" },
        { id: "autism-assessment", label: "Autism", contentKey: "assessments.packages.autism" },
        { id: "school-observations", label: "School Observations", contentKey: "assessments.schoolObservations" },
        { id: "assessment-faq", label: "FAQ", contentKey: "assessments.faq" }
      ]
    },

    groups: {
      id: "groups",
      title: "Group Room",
      exteriorEntry: "Upper group therapy window/sign",
      sourceUrls: [
        "https://www.therapyhouse.com.au/group-therapy/",
        "https://www.therapyhouse.com.au/group-therapy/circle-of-security-parenting-program/",
        "https://www.therapyhouse.com.au/external-workshop-expression-of-interest/"
      ],
      summary: "Group therapy programs, Circle of Security Parenting and workshop/seminar expression-of-interest content.",
      hotspots: [
        { id: "group-overview", label: "Group Therapy", contentKey: "groups.overview" },
        { id: "emotion-regulation", label: "Emotion Regulation", contentKey: "groups.programs.emotionRegulation" },
        { id: "hunter-remote", label: "Hunter's Remote", contentKey: "groups.programs.hunterRemote" },
        { id: "social-relationships", label: "Social Relationships", contentKey: "groups.programs.socialRelationships" },
        { id: "lego-club", label: "Lego Club", contentKey: "groups.programs.legoClub" },
        { id: "circle-security", label: "Circle Of Security", contentKey: "groups.circleOfSecurity" },
        { id: "workshops", label: "Workshops", contentKey: "groups.workshops" }
      ]
    },

    library: {
      id: "library",
      title: "Library",
      exteriorEntry: "Left blogs sign / tower window",
      sourceUrls: [
        "https://www.therapyhouse.com.au/blogs/",
        "https://www.therapyhouse.com.au/products/",
        "https://www.therapyhouse.com.au/videos/",
        "https://www.therapyhouse.com.au/publications/",
        "https://www.therapyhouse.com.au/media/"
      ],
      summary: "Resource hub for blogs, products, videos, publications and media appearances.",
      hotspots: [
        { id: "blogs", label: "Blogs", contentKey: "library.blogArticles" },
        { id: "products", label: "Books", contentKey: "library.products" },
        { id: "videos", label: "Videos", contentKey: "library.videos" },
        { id: "publications", label: "Publications", contentKey: "library.publications" },
        { id: "media", label: "Media", contentKey: "library.media" }
      ]
    },

    contact: {
      id: "contact",
      title: "Reception",
      exteriorEntry: "Mailbox",
      sourceUrls: ["https://www.therapyhouse.com.au/contact/"],
      summary: "Practical contact, booking, parking and location information.",
      hotspots: [
        { id: "book-online", label: "Book Online", contentKey: "contact.bookingUrl" },
        { id: "phone", label: "Phone", contentKey: "contact.phone" },
        { id: "email", label: "Email", contentKey: "contact.email" },
        { id: "address", label: "Address", contentKey: "contact.address" },
        { id: "parking", label: "Parking", contentKey: "contact.intro" }
      ]
    },

    "work-with-us": {
      id: "work-with-us",
      title: "Work With Us",
      exteriorEntry: "Side door / staff noticeboard",
      sourceUrls: ["https://www.therapyhouse.com.au/workwithus/"],
      summary: "Clinic culture, values and work-with-us enquiry content.",
      hotspots: [
        { id: "opportunities", label: "Opportunities", contentKey: "workWithUs.opportunities" },
        { id: "clinic-culture", label: "Clinic Culture", contentKey: "workWithUs.culture" },
        { id: "values", label: "Values", contentKey: "workWithUs.values" },
        { id: "enquire", label: "Enquire", contentKey: "workWithUs.enquiry" }
      ]
    }
  },

  philosophy: {
    title: "Our Philosophy",
    intro: "Counselling and psychology should feel warm and inviting. Our clinic is a nurturing place where people can feel safe, understood and supported.",
    principles: [
      { title: "Holistic Care", body: "We focus on your whole story, not only a diagnosis." },
      { title: "Inclusive Environment", body: "Our space is safe, neuro-affirming and welcoming for LGBTQIA+ people." },
      { title: "Sanctuary for Wellness", body: "You can work towards wellbeing at your own pace." },
      { title: "Meaningful Connections", body: "We build purposeful relationships so you feel heard and valued." },
      { title: "Authenticity", body: "We bring genuine care to the counselling process." }
    ],
    closing: "Your wellbeing matters. We are here to support you."
  },

  services: {
    sourceUrl: "https://www.therapyhouse.com.au/services/",
    intro: "We have established Therapy House with the aim of providing high quality evidence based services to our clients.",
    offerings: [
      "Assessment of ADHD, Autism, and developmental disorders",
      "Cognitive assessment for giftedness or cognitive impairment",
      "Assessment of memory and concentration",
      "Assessment of learning disabilities such as Dyslexia and Dysgraphia",
      "Therapy with children for anxiety, fears, depression, school avoidance, peer relationship problems and low self-esteem",
      "Family therapy for families in distress",
      "Couple therapy",
      "Adult short-term psychodynamic therapy"
    ],
    therapyModels: [
      "Cognitive behaviour therapy with children and adults (CBT)",
      "Acceptance and commitment therapy (ACT)",
      "Emotionally focused therapy for couples, families and individuals (EFT)",
      "Eye Movement Desensitisation Reprocessing with people who have experienced trauma (EMDR)",
      "Short term psychodynamic therapy for deeper problems that can be manifested as anxiety, depression, personality disorders and relationship problems"
    ],
    fees: [
      { label: "Initial psychologist session", value: "$320" },
      { label: "Ongoing individual session with Dr Kaya Beinke", value: "$290" },
      { label: "Ongoing individual session with Dr Amelia Shay", value: "$270" },
      { label: "Ongoing session with other registered psychologists", value: "$260" },
      { label: "Appointments at 4pm and onwards", value: "$10 evening fee" },
      { label: "Couples/family sessions", value: "$280 to $350" },
      { label: "Assessment packages", value: "$1200 to $3000" }
    ],
    rebates: [
      "Medicare rebates are available via GP referral and Mental Health Care Plan for eligible individual sessions.",
      "Medicare does not cover couple and family sessions.",
      "Private health insurance may include psychology, but Medicare and private health insurance cannot be used at the same time."
    ],
    reports: [
      "Assessments, letters, reports and other services such as stakeholder meetings are charged in addition to session charges.",
      "Letters and reports are charged at hourly rates and typical letters take 30 minutes to one hour to prepare."
    ]
  },

  assessments: {
    sourceUrl: "https://www.therapyhouse.com.au/assessments/",
    intro: [
      "Assessment processes can vary across psychology clinics and clinicians.",
      "Therapy House is located in The Gap, Brisbane Northside and has provisional practitioners and fully registered psychologists trained in assessment.",
      "Only provisional psychologists with relevant training undertake assessment cases, and all reports are signed off by a fully registered psychologist."
    ],
    process: [
      "Call the clinic and let the team know you are seeking assessment.",
      "Send an email with a brief description of reasons for seeking assessment.",
      "Reception discusses the request with the clinical team leader and advises who would be the best clinician.",
      "Complete online background forms before intake so the clinician can review background information.",
      "After intake, the clinician discusses assessment options and the most appropriate process.",
      "Book assessment sessions through reception based on family and clinician availability and the person's capacity to focus.",
      "The clinician may require up to four weeks from the last assessment session to analyse, interpret, receive collateral information and write the report.",
      "Once payment has been received and the report is finalised, a feedback session can be booked."
    ],
    documents: [
      "Referral, if applicable",
      "School reports",
      "NAPLAN results, if applicable",
      "Any prior assessment reports",
      "Relevant intervention documentation such as reading intervention, occupational therapy or speech assessment",
      "Any letters with prior diagnoses"
    ],
    packages: {
      psychoeducational: {
        title: "Comprehensive Psycho-educational Assessment",
        price: "From $2,400; provisional from $1,900",
        inclusions: [
          "Parent intake session",
          "4-5 hours of child testing",
          "Questionnaires",
          "Assessment scoring and report writing",
          "Feedback session"
        ]
      },
      cognitive: {
        title: "Cognitive Assessment",
        price: "From $1,621; provisional from $1,366",
        description: "Aims to understand a child's cognitive strengths and weaknesses."
      },
      adhd: {
        title: "ADHD Assessment",
        price: "From $1,000; provisional from $846",
        description: "Includes intake, diagnostic interview, questionnaires, scoring and a feedback session."
      },
      autism: {
        title: "Autism Assessment",
        price: "From $1,000; provisional from $846",
        description: "Explores social communication differences, routine reliance and related presentation."
      }
    },
    schoolObservations: {
      title: "School Observations",
      price: "$250 plus travel",
      description: "Optional add-on where school context is clinically useful."
    },
    faq: [
      "Assessments typically involve three to four sessions.",
      "Reports may take up to four weeks after the last assessment session.",
      "People pursue assessment for self-understanding, validation, funding, school or work adjustments.",
      "Paediatricians or psychiatrists may need to be involved when medication or funding is sought."
    ]
  },

  groups: {
    sourceUrl: "https://www.therapyhouse.com.au/group-therapy/",
    overview: [
      "Group therapy is an effective and affordable way to seek help.",
      "In a group setting people can feel supported by others with similar problems and learn structured skills.",
      "Groups are matched by age and consistent attendance is encouraged for social connection."
    ],
    programs: {
      emotionRegulation: {
        title: "Emotion Regulation and Social Skills Workshop",
        audience: "Children aged 7-12 years",
        description: "Helps children identify emotions, body signals, triggers and ways to regulate thoughts, emotions and behaviours."
      },
      hunterRemote: {
        title: "Hunter and His Amazing Remote Control",
        audience: "Children aged 6-10 years",
        description: "Uses a brain remote control metaphor to teach attention, problem-solving and regulation skills across eight sessions."
      },
      socialRelationships: {
        title: "Navigating Social Relationships",
        audience: "Young people aged 12-15 years",
        description: "Eight-week program based on the PEERS framework, focusing on friendships, conversation skills, rejection, humour, electronic communication and conflict management."
      },
      legoClub: {
        title: "Lego Club",
        audience: "Children aged 6-12 years",
        description: "Eight-week program using Lego therapy to support social communication, turn-taking, sharing, listening, teamwork and problem-solving."
      }
    },
    circleOfSecurity: {
      sourceUrl: "https://www.therapyhouse.com.au/group-therapy/circle-of-security-parenting-program/",
      title: "Circle of Security Parenting Program",
      description: "Based on attachment theory and designed to help parents recognise their child's needs and foster secure relationships.",
      details: [
        "Location: Therapy House Clinic, 1290 Waterworks Rd, The Gap",
        "Audience: Parents of children aged 4 months to 12 years",
        "Schedule: Eight 90-minute sessions",
        "Group size: 3-6 participants",
        "Cost: $125 per group session; $1,000 total"
      ]
    },
    workshops: {
      sourceUrl: "https://www.therapyhouse.com.au/external-workshop-expression-of-interest/",
      title: "Workshop or Seminar Expression of Interest",
      topics: [
        "Positive parenting",
        "Psychological adjustment to parenting",
        "Early development",
        "Emotion regulation",
        "Perinatal mental health"
      ]
    }
  },

  team: {
    sourceUrl: "https://www.therapyhouse.com.au/about/",
    availability: [
      { name: "Dr Amelia Shay", status: "Not currently accepting new clients" },
      { name: "Dr Kaya Beinke", status: "Not currently accepting new clients" },
      { name: "Letitia McVey", status: "On leave" },
      { name: "Sahar Fattahi", status: "Active waitlist for new clients" },
      { name: "Rani Banks", status: "Accepting new clients" },
      { name: "Jazmin Squire", status: "Active waitlist for new clients" },
      { name: "Laura Storey", status: "Accepting new clients" },
      { name: "Genevieve Hussey", status: "Not currently accepting new clients" }
    ],
    dogs: ["Reea", "Samson"],
    members: [
      {
        name: "Dr Amelia Shay",
        role: "Director, Developmental Psychologist",
        sourceUrl: "https://www.therapyhouse.com.au/staff-member/dr-amelia-shay/",
        credentials: "PhD, MPsy, BPsySc. Developmental Psychologist",
        summary: "Amelia works with adults, parents and couples, and can deliver counselling and psychological interventions in English and Persian (Farsi)."
      },
      {
        name: "Dr Kaya Beinke",
        role: "Clinical Psychologist, Chief Clinical Officer",
        sourceUrl: "https://www.therapyhouse.com.au/staff-member/dr-kaya-beinke/",
        credentials: "BPsych (Hons), PhD Clin Psych",
        summary: "Kaya has experience across clinical psychology, supervision, developmental delay, Autism, ADHD, chronic health and trauma-impacted family support."
      },
      {
        name: "Letitia McVey",
        role: "Psychologist, Educational and Developmental Registrar, Chief Operating Officer",
        sourceUrl: "https://www.therapyhouse.com.au/staff-member/letitia-mcvey/",
        credentials: "BPsychSc (Hons), MPsy (Educational and Developmental Psychology)",
        summary: "Letitia is a warm and collaborative practitioner who works with children, adolescents and adults, with a focus on resilience, strengths and hope."
      },
      {
        name: "Sahar Fattahi",
        role: "Psychologist",
        sourceUrl: "https://www.therapyhouse.com.au/staff-member/sahar-h-fattahi-general-psychologist/",
        credentials: "MSCP Psychologist",
        summary: "Sahar works with clients across the lifespan and can deliver interventions in English, Persian (Farsi) and Filipino (Tagalog)."
      },
      {
        name: "Rani Banks",
        role: "Clinical Psychologist",
        sourceUrl: "https://www.therapyhouse.com.au/staff-member/rani-banks/",
        credentials: "Clinical Psychologist",
        summary: "Rani is listed as accepting new clients on the current team page."
      },
      {
        name: "Jazmin Squire",
        role: "Psychologist",
        sourceUrl: "https://www.therapyhouse.com.au/staff-member/jazmin-squire/",
        credentials: "Psychologist",
        summary: "Jazmin is a warm and engaging clinician with a flexible, non-judgemental approach and enjoys working with people of all ages."
      },
      {
        name: "Laura Storey",
        role: "Counsellor",
        sourceUrl: "https://www.therapyhouse.com.au/staff-member/laura-storey-counsellor/",
        credentials: "Counsellor",
        summary: "Laura approaches therapeutic work in a person-centred, trauma-informed and neuro-affirming way."
      },
      {
        name: "Genevieve Hussey",
        role: "Provisional Psychologist",
        sourceUrl: "https://www.therapyhouse.com.au/staff-member/genevieve-hussey/",
        credentials: "Provisional Psychologist",
        summary: "Gen is a warm and dedicated clinician who is passionate about supporting young people and families."
      },
      {
        name: "Natasha",
        role: "Client Support and Marketing Coordinator",
        sourceUrl: "https://www.therapyhouse.com.au/staff-member/natasha-client-support-marketing/",
        credentials: "Client Support and Marketing Coordinator",
        summary: "Natasha supports clients and contributes to Therapy House marketing and communications."
      },
      {
        name: "Josie",
        role: "Administrative Support",
        sourceUrl: "https://www.therapyhouse.com.au/staff-member/josie-administrative-support/",
        credentials: "Administrative Support",
        summary: "Josie supports the administrative side of Therapy House."
      },
      {
        name: "Reea",
        role: "Therapy Dog",
        sourceUrl: "https://www.therapyhouse.com.au/staff-member/reea-therapy-dog/",
        credentials: "Therapy Dog",
        summary: "Reea is part of the Therapy House team and is described as the clinic's therapy dog."
      },
      {
        name: "Samson",
        role: "Retired Therapy Dog",
        sourceUrl: "https://www.therapyhouse.com.au/staff-member/samson-therapy-dog/",
        credentials: "Retired Therapy Dog",
        summary: "Samson is remembered by Therapy House as a loved presence who helped visitors feel safe."
      }
    ]
  },

  library: {
    products: [
      {
        title: "Little Koala - Helping children with their fears",
        sourceUrl: "https://www.therapyhouse.com.au/products/",
        description: "A children's story addressing fear and separation anxiety, suitable for bedtime reading or early-childhood settings."
      },
      {
        title: "What Is Going On In My Head",
        sourceUrl: "https://www.therapyhouse.com.au/products/",
        description: "A 68-page book for therapists working with children, guiding CBT and ACT techniques across three phases of therapy."
      }
    ],
    videos: {
      sourceUrl: "https://www.therapyhouse.com.au/videos/",
      topics: [
        "A note on happiness",
        "The approaches we use and a welcome message from Dr Amelia",
        "The Lockdown Challenge",
        "Persian-language videos"
      ]
    },
    publications: {
      sourceUrl: "https://www.therapyhouse.com.au/publications/",
      description: "Scholarly works by Dr Amelia Shay, including book chapters, journal articles, conference presentations and Persian-language publications."
    },
    media: {
      sourceUrl: "https://www.therapyhouse.com.au/media/",
      items: [
        "If you can only do one thing for your children, it should be shared reading",
        "Diversity in the classroom means children develop differently",
        "More children are starting school depressed and anxious - without help, it will only get worse",
        "Radio interviews on reading to children and shared reading"
      ]
    },
    blogArticles: [
      {
        title: "The Lasting Value of Long-Term Psychodynamic Therapy: Who It Helps and Why It Works",
        slug: "long-term-psychodynamic-therapy",
        date: "2025-10-14",
        url: "https://www.therapyhouse.com.au/therapy/long-term-psychodynamic-therapy/",
        excerpt: "In today's wellness culture, quick fixes are everywhere - apps for mindfulness, short-term coaching, or fast-acting therapies that aim to relieve symptoms quickly."
      },
      {
        title: "Helping Kids Build Healthy Screen Time Habits: A Parent's Guide",
        slug: "screen-time",
        date: "2025-10-01",
        url: "https://www.therapyhouse.com.au/child-psychologists/screen-time/",
        excerpt: "A parent guide to helping children build healthy screen time habits in a digital world."
      },
      {
        title: "Practicing Self-Compassion to Manage Uncomfortable Emotions",
        slug: "practicing-self-compassion",
        date: "2025-08-05",
        url: "https://www.therapyhouse.com.au/therapy/practicing-self-compassion/",
        excerpt: "How responding with self-compassion rather than self-criticism can make it easier to handle overwhelming situations."
      },
      {
        title: "How To Have A Loving Relationship With Your Body",
        slug: "how-to-have-a-loving-relationship-with-your-body",
        date: "2025-06-10",
        url: "https://www.therapyhouse.com.au/therapy/how-to-have-a-loving-relationship-with-your-body/",
        excerpt: "A Therapy House article about healing a relationship with food and body image."
      },
      {
        title: "12 Practical Tips to Manage Depression from Behavioural Therapy Experts",
        slug: "practical-tips-to-manage-depression",
        date: "2025-05-27",
        url: "https://www.therapyhouse.com.au/therapy/practical-tips-to-manage-depression/",
        excerpt: "Practical behavioural strategies for managing depression."
      },
      {
        title: "Holding Two Truths: The Power of Emotional Duality in Relationships",
        slug: "emotional-duality-in-relationships",
        date: "2025-05-22",
        url: "https://www.therapyhouse.com.au/relationship/emotional-duality-in-relationships/",
        excerpt: "A Therapy House article about holding two emotions or truths as valid at the same time in relationships."
      },
      {
        title: "Nurturing Healthy Self-Esteem in Children",
        slug: "nurturing-healthy-self-esteem",
        date: "2025-04-01",
        url: "https://www.therapyhouse.com.au/child-psychologists/nurturing-healthy-self-esteem/",
        excerpt: "How parents and caregivers can foster a strong sense of self-worth in children."
      },
      {
        title: "Why We Procrastinate: Understanding the Psychology Behind It",
        slug: "procrastination",
        date: "2025-01-28",
        url: "https://www.therapyhouse.com.au/therapy/procrastination/",
        excerpt: "A Therapy House article exploring the psychology behind procrastination."
      },
      {
        title: "Understanding and Supporting School Readiness",
        slug: "school-readiness",
        date: "2024-12-03",
        url: "https://www.therapyhouse.com.au/therapy/school-readiness/",
        excerpt: "A guide to supporting children and families through the transition to formal schooling."
      },
      {
        title: "Conflict",
        slug: "conflict",
        date: "2024-11-11",
        url: "https://www.therapyhouse.com.au/therapy/conflict/",
        excerpt: "A Therapy House article about conflict in relationships and problem solving at home."
      },
      {
        title: "Self Care",
        slug: "self-care",
        date: "2024-05-21",
        url: "https://www.therapyhouse.com.au/therapy/self-care/",
        excerpt: "How to establish a self-care routine that actually works."
      },
      {
        title: "Sense of Self",
        slug: "sense-of-self",
        date: "2024-05-08",
        url: "https://www.therapyhouse.com.au/child-psychologists/sense-of-self/",
        excerpt: "A Therapy House article about sense of self across adults and children."
      },
      {
        title: "The Autonomic Nervous System and Mental Health: Strategies to Ease Anxiety, Depression and Trauma Response",
        slug: "autonomic-nervous-system",
        date: "2024-04-02",
        url: "https://www.therapyhouse.com.au/therapy/autonomic-nervous-system/",
        excerpt: "Strategies to ease anxiety, depression and trauma responses through understanding the nervous system."
      },
      {
        title: "What is Depression?",
        slug: "what-is-depression",
        date: "2024-03-12",
        url: "https://www.therapyhouse.com.au/therapy/what-is-depression/",
        excerpt: "A Therapy House article explaining depression as a combination of symptoms beyond feeling low."
      },
      {
        title: "How Involved Should Parents Be In Their Child's Therapy?",
        slug: "parent-involvement-in-child-therapy",
        date: "2024-02-13",
        url: "https://www.therapyhouse.com.au/therapy/parent-involvement-in-child-therapy/",
        excerpt: "Guidance for parents about involvement in a child's therapy."
      },
      {
        title: "What Is Therapy?",
        slug: "what-actually-is-therapy",
        date: "2024-01-22",
        url: "https://www.therapyhouse.com.au/therapy/what-actually-is-therapy/",
        excerpt: "A first-time guide for people considering therapy for themselves or their child."
      },
      {
        title: "Are You Learning At Your Full Potential?",
        slug: "is-your-child-learning-to-the-best-of-their-capacity",
        date: "2023-08-30",
        url: "https://www.therapyhouse.com.au/assessments/is-your-child-learning-to-the-best-of-their-capacity/",
        excerpt: "A Therapy House assessment article about strengths, weaknesses and learning capacity."
      },
      {
        title: "Do You Really Know What Anxiety Is?",
        slug: "do-you-really-know-what-anxiety-is",
        date: "2023-06-28",
        url: "https://www.therapyhouse.com.au/workshops/self-regulation/do-you-really-know-what-anxiety-is/",
        excerpt: "A Therapy House article about the function of anxiety and how it protects us."
      },
      {
        title: "New Cancellation Policy",
        slug: "new-cancellation-policy",
        date: "2023-05-05",
        url: "https://www.therapyhouse.com.au/news/new-cancellation-policy/",
        excerpt: "A Therapy House update about cancellation policy and appointment commitment."
      },
      {
        title: "Therapy is a Commitment",
        slug: "therapy-house-update",
        date: "2023-05-05",
        url: "https://www.therapyhouse.com.au/news/therapy-house-update/",
        excerpt: "A Therapy House update about therapy as a commitment to yourself."
      },
      {
        title: "What is ADHD?",
        slug: "what-is-adhd",
        date: "2023-05-05",
        url: "https://www.therapyhouse.com.au/assessments/what-is-adhd/",
        excerpt: "An introduction to ADHD as a neurodevelopmental disorder affecting attention, impulses and activity."
      },
      {
        title: "Different Parenting Approaches and How Successful They Are",
        slug: "parenting-styles-parenting-tips",
        date: "2023-03-20",
        url: "https://www.therapyhouse.com.au/workshops/circle-of-security-parenting-program/parenting-styles-parenting-tips/",
        excerpt: "A Therapy House article about parenting approaches and child social-emotional development."
      },
      {
        title: "Emotion Regulation Skills, Tips and Strategy",
        slug: "emotion-regulation-skills-strategy",
        date: "2023-01-10",
        url: "https://www.therapyhouse.com.au/workshops/self-regulation/emotion-regulation-skills-strategy/",
        excerpt: "A Therapy House article explaining emotion regulation and useful skills."
      }
    ]
  },

  workWithUs: {
    sourceUrl: "https://www.therapyhouse.com.au/workwithus/",
    values: ["care", "compassion", "respect"],
    culture: [
      "Therapy House describes a pleasant work environment with sound-proof rooms, ergonomic furniture and a focus on long-term commitment.",
      "Prospective psychologists at various career stages are encouraged to enquire."
    ],
    opportunities: [
      "Psychologists and clinicians interested in joining Therapy House can use the work-with-us pathway."
    ],
    enquiry: {
      email: "admin@therapyhouse.com.au",
      sourceUrl: "https://www.therapyhouse.com.au/workwithus/"
    }
  }
};
