import { asset } from "./site-data.js";

/*
 * The words a visitor reads are not written in this file (issue #94). Clinic
 * staff edit them in Pages CMS, which can change JSON but not JavaScript, so
 * they live in three JSON files beside the scripts:
 *
 *   public/assets/content/clinic.json       phone, email, address, booking link
 *   public/assets/content/house-rooms.json  room names, sign labels, picture alt text
 *   public/assets/content/house-copy.json   what each sign opens
 *
 * This module is served to the browser as it is, with no bundler, and it is
 * also imported by the Astro build (through src/data/site.js) and by the
 * tests under Node. A JSON module import (`with { type: "json" }`) is the one
 * way of reading a JSON file that all three understand: the browser fetches
 * the file next to this script, Vite inlines it, and Node reads it from disk.
 * That is also why the files sit under public/ rather than src/: the browser
 * can only fetch what the site serves. Fetching at run time would have worked
 * in the browser too, but it would have made every export below wait on a
 * promise, and the Astro build could not have read the phone number from it.
 *
 * Positions, transforms, image paths and which sign opens what stay here.
 * The JS and the JSON are joined by `id`, and a missing id throws, so a
 * renamed sign fails the tests rather than showing an empty label.
 */
import clinic from "../content/clinic.json" with { type: "json" };
import houseRooms from "../content/house-rooms.json" with { type: "json" };
import houseCopy from "../content/house-copy.json" with { type: "json" };

export { clinic };

/*
 * The phone number is written once, the way a visitor reads it
 * ("07 3300 2170"), and the dialable link is worked out from it so the two
 * cannot drift apart. Australian numbers: drop the leading 0, add +61.
 */
export const phoneHref = (phone) => `tel:+61${phone.replace(/\D/g, "").replace(/^0/, "")}`;

function roomText(roomId) {
  const room = houseRooms.rooms.find((candidate) => candidate.id === roomId);
  if (!room) throw new Error(`house-rooms.json has no room with id "${roomId}"`);
  return room;
}

function signText(roomId, signId) {
  const sign = roomText(roomId).signs.find((candidate) => candidate.id === signId);
  if (!sign) throw new Error(`house-rooms.json has no sign "${signId}" in room "${roomId}"`);
  return { label: sign.label, ariaLabel: sign.ariaLabel };
}

/* A background picture, its alt text looked up by the file name without its extension. */
function roomLayer(roomId, path, className) {
  const id = path.split("/").pop().replace(/\.\w+$/, "");
  const image = (roomText(roomId).images || []).find((candidate) => candidate.id === id);
  if (!image) throw new Error(`house-rooms.json has no image "${id}" in room "${roomId}"`);
  return className
    ? { src: asset(path), className, alt: image.alt }
    : { src: asset(path), alt: image.alt };
}

export const roomIds = ["exterior", "welcome", "team", "services", "assessments", "groups", "library", "philosophy", "contact", "work-with-us"];

function navigationRoom(id) {
  const { title, label, description, exteriorEntry } = roomText(id);
  if (id === "exterior") {
    return { id, title, type: "turntable", label, description, entryPoint: "turntable", route: `#${id}` };
  }
  return { id, title, type: "interior", label, exteriorEntry, route: `#${id}` };
}

export const roomNavigation = {
  initialRoomId: "exterior",
  defaultInteriorRoomId: "welcome",
  roomOrder: roomIds,
  rooms: Object.fromEntries(roomIds.map((id) => [id, navigationRoom(id)]))
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

/* A sign inside a room. Its words come from house-rooms.json by `room` and `id`. */
function hotspot({ room, ...config }) {
  return sceneSign({ ...config, ...signText(room, config.id) });
}

function sceneSign({
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
    ...signText("exterior", "main-door"),
    targetRoom: "welcome",
    exteriorFeature: "front door",
    contentKey: "rooms.welcome",
    position: { x: 0.56, y: 0.53, width: 0.16, height: 0.28, shiftX: -0.14 }
  },
  {
    id: "services-window",
    ...signText("exterior", "services-window"),
    targetRoom: "services",
    exteriorFeature: "right services window",
    contentKey: "rooms.services",
    position: { x: 0.835, y: 0.42, width: 0.19, height: 0.24, shiftX: -0.09 }
  },
  {
    id: "group-window",
    ...signText("exterior", "group-window"),
    targetRoom: "groups",
    exteriorFeature: "upper group therapy window/sign",
    contentKey: "rooms.groups",
    position: { x: 0.63, y: 0.13, width: 0.22, height: 0.13, shiftX: -0.08 }
  },
  {
    id: "blogs-sign",
    ...signText("exterior", "blogs-sign"),
    targetRoom: "library",
    exteriorFeature: "left blogs sign / tower window",
    contentKey: "rooms.library",
    position: { x: 0.35, y: 0.41, width: 0.18, height: 0.18, shiftX: -0.11 }
  },
  {
    id: "team-sign",
    ...signText("exterior", "team-sign"),
    targetRoom: "team",
    exteriorFeature: "team garden sign",
    contentKey: "rooms.team",
    position: { x: 0.45, y: 0.72, width: 0.19, height: 0.15, shiftX: -0.12 }
  },
  {
    id: "mailbox",
    ...signText("exterior", "mailbox"),
    targetRoom: "contact",
    exteriorFeature: "mailbox",
    contentKey: "rooms.contact",
    position: { x: 0.835, y: 0.66, width: 0.16, height: 0.22, shiftX: -0.08 }
  },
  {
    id: "staff-side-door",
    ...signText("exterior", "staff-side-door"),
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
          roomLayer("welcome", "assets/media/inside-layer-1.webp", "inside-parallax__layer--background"),
          roomLayer("welcome", "assets/media/inside-layer-2.webp", "inside-parallax__layer--middle"),
          roomLayer("welcome", "assets/media/inside-layer-3.webp", "inside-parallax__layer--foreground")
        ]
      },
      hotspots: [
        hotspot({
          room: "welcome",
          id: "about",
          action: "about",
          targetRoom: "team",
          contentKey: "team",
          className: "scene-sign--table",
          x: 840,
          y: 265,
          scale: 0.78
        }),
        hotspot({
          room: "welcome",
          id: "philosophy",
          action: "philosophy",
          contentKey: "philosophy",
          className: "scene-sign--wall",
          x: 335,
          y: 265,
          perspective: 230,
          rotateY: 35.4,
          rotate: 0.5,
          scale: 0.84
        }),
        hotspot({
          room: "welcome",
          id: "contact",
          action: "contact",
          targetRoom: "contact",
          contentKey: "contact",
          className: "scene-sign--notebook",
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
          room: "welcome",
          id: "back",
          action: "back",
          contentKey: "rooms.exterior",
          className: "scene-sign--door",
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
          roomLayer("team", "assets/rooms/team-parlour.webp")
        ]
      },
      effects: { firelight: false, dogEyes: false },
      hotspots: [
        hotspot({ room: "team", id: "team-carousel", action: "about", contentKey: "team.members", x: 1090, y: 122 }),
        hotspot({ room: "team", id: "availability", contentKey: "team.availability", x: 1120, y: 315 }),
        hotspot({ room: "team", id: "therapy-dogs", contentKey: "team.dogs", x: 420, y: 720 }),
        hotspot({ room: "team", id: "back", action: "back", x: 1450, y: 160 })
      ]
    },

    services: {
      id: "services",
      imageSize: roomImageSize,
      background: {
        layers: [
          roomLayer("services", "assets/rooms/consulting-room.webp")
        ]
      },
      effects: { firelight: false, dogEyes: false },
      hotspots: [
        hotspot({ room: "services", id: "service-list", contentKey: "services.offerings", x: 1040, y: 360 }),
        hotspot({ room: "services", id: "therapy-models", contentKey: "services.therapyModels", x: 1180, y: 230 }),
        hotspot({ room: "services", id: "fees", contentKey: "services.fees", x: 1370, y: 610 }),
        hotspot({ room: "services", id: "rebates", contentKey: "services.rebates", x: 1330, y: 760 }),
        hotspot({ room: "services", id: "reports", contentKey: "services.reports", x: 1490, y: 465 }),
        hotspot({ room: "services", id: "assessment-room", targetRoom: "assessments", contentKey: "rooms.assessments", x: 650, y: 735 }),
        hotspot({ room: "services", id: "back", action: "back", x: 170, y: 305 })
      ]
    },

    assessments: {
      id: "assessments",
      imageSize: roomImageSize,
      background: {
        layers: [
          roomLayer("assessments", "assets/rooms/assessment-room.webp")
        ]
      },
      effects: { firelight: false, dogEyes: false },
      hotspots: [
        hotspot({ room: "assessments", id: "assessment-process", contentKey: "assessments.process", x: 1220, y: 405 }),
        hotspot({ room: "assessments", id: "assessment-documents", contentKey: "assessments.documents", x: 1120, y: 720 }),
        hotspot({ room: "assessments", id: "psychoeducational-assessment", contentKey: "assessments.packages.psychoeducational", x: 560, y: 630 }),
        hotspot({ room: "assessments", id: "cognitive-assessment", contentKey: "assessments.packages.cognitive", x: 705, y: 530 }),
        hotspot({ room: "assessments", id: "adhd-assessment", contentKey: "assessments.packages.adhd", x: 885, y: 570 }),
        hotspot({ room: "assessments", id: "autism-assessment", contentKey: "assessments.packages.autism", x: 1310, y: 785 }),
        hotspot({ room: "assessments", id: "school-observations", contentKey: "assessments.schoolObservations", x: 1430, y: 710 }),
        hotspot({ room: "assessments", id: "assessment-faq", contentKey: "assessments.faq", x: 1490, y: 850 }),
        hotspot({ room: "assessments", id: "back", action: "back", x: 155, y: 155 })
      ]
    },

    groups: {
      id: "groups",
      imageSize: roomImageSize,
      background: {
        layers: [
          roomLayer("groups", "assets/rooms/group-room.webp")
        ]
      },
      effects: { firelight: false, dogEyes: false },
      hotspots: [
        hotspot({ room: "groups", id: "group-overview", contentKey: "groups.overview", x: 835, y: 390 }),
        hotspot({ room: "groups", id: "emotion-regulation", contentKey: "groups.programs.emotionRegulation", x: 710, y: 835 }),
        hotspot({ room: "groups", id: "hunter-remote", contentKey: "groups.programs.hunterRemote", x: 435, y: 835 }),
        hotspot({ room: "groups", id: "social-relationships", contentKey: "groups.programs.socialRelationships", x: 1110, y: 850 }),
        hotspot({ room: "groups", id: "lego-club", contentKey: "groups.programs.legoClub", x: 835, y: 620 }),
        hotspot({ room: "groups", id: "circle-security", contentKey: "groups.circleOfSecurity", x: 1370, y: 830 }),
        hotspot({ room: "groups", id: "workshops", contentKey: "groups.workshops", x: 585, y: 300 }),
        hotspot({ room: "groups", id: "back", action: "back", x: 1450, y: 190 })
      ]
    },

    library: {
      id: "library",
      imageSize: roomImageSize,
      background: {
        layers: [
          roomLayer("library", "assets/rooms/library-room.webp")
        ]
      },
      effects: { firelight: false, dogEyes: false },
      hotspots: [
        hotspot({ room: "library", id: "blogs", contentKey: "library.blogArticles", x: 790, y: 720 }),
        hotspot({ room: "library", id: "products", contentKey: "library.products", x: 1130, y: 560 }),
        hotspot({ room: "library", id: "videos", contentKey: "library.videos", x: 835, y: 430 }),
        hotspot({ room: "library", id: "publications", contentKey: "library.publications", x: 1240, y: 750 }),
        hotspot({ room: "library", id: "media", contentKey: "library.media", x: 1450, y: 410 }),
        hotspot({ room: "library", id: "attic", targetRoom: "philosophy", contentKey: "rooms.philosophy", x: 500, y: 105 }),
        hotspot({ room: "library", id: "back", action: "back", x: 180, y: 180 })
      ]
    },

    /*
     * The attic over the library. It is the room the philosophy page opens on,
     * so the picture a visitor clicks there is the room they arrive in — and
     * the principles are hung on the objects rather than listed on a wall:
     * the whole story on the shelves, the many-pictured frame, the window you
     * reach at your own pace, the birdhouse someone built for someone else,
     * and a book left open.
     */
    philosophy: {
      id: "philosophy",
      imageSize: roomImageSize,
      background: {
        layers: [
          roomLayer("philosophy", "assets/rooms/library-attic-room.webp")
        ]
      },
      effects: { firelight: false, dogEyes: false },
      hotspots: [
        hotspot({ room: "philosophy", id: "philosophy-overview", contentKey: "philosophy", x: 650, y: 620 }),
        hotspot({ room: "philosophy", id: "holistic-care", contentKey: "philosophy.principles.0", x: 245, y: 265 }),
        hotspot({ room: "philosophy", id: "inclusive-environment", contentKey: "philosophy.principles.1", x: 1190, y: 300 }),
        hotspot({ room: "philosophy", id: "sanctuary", contentKey: "philosophy.principles.2", x: 838, y: 320 }),
        hotspot({ room: "philosophy", id: "meaningful-connections", contentKey: "philosophy.principles.3", x: 1400, y: 440 }),
        hotspot({ room: "philosophy", id: "authenticity", contentKey: "philosophy.principles.4", x: 420, y: 755 }),
        hotspot({ room: "philosophy", id: "back", action: "back", x: 455, y: 470 })
      ]
    },

    contact: {
      id: "contact",
      imageSize: roomImageSize,
      background: {
        layers: [
          roomLayer("contact", "assets/rooms/reception-room.webp")
        ]
      },
      effects: { firelight: false, dogEyes: false },
      hotspots: [
        hotspot({ room: "contact", id: "book-online", contentKey: "contact.bookingUrl", x: 1480, y: 335 }),
        hotspot({ room: "contact", id: "phone", contentKey: "contact.phone", x: 1410, y: 485 }),
        hotspot({ room: "contact", id: "email", contentKey: "contact.email", x: 940, y: 280 }),
        hotspot({ room: "contact", id: "address", contentKey: "contact.address", x: 880, y: 485 }),
        hotspot({ room: "contact", id: "parking", contentKey: "contact.intro", x: 290, y: 550 }),
        hotspot({ room: "contact", id: "back", action: "back", x: 180, y: 180 })
      ]
    },

    "work-with-us": {
      id: "work-with-us",
      imageSize: roomImageSize,
      background: {
        layers: [
          roomLayer("work-with-us", "assets/rooms/work-with-us-room.webp")
        ]
      },
      effects: { firelight: false, dogEyes: false },
      hotspots: [
        hotspot({ room: "work-with-us", id: "opportunities", contentKey: "workWithUs.opportunities", x: 840, y: 300 }),
        hotspot({ room: "work-with-us", id: "clinic-culture", contentKey: "workWithUs.culture", x: 700, y: 560 }),
        hotspot({ room: "work-with-us", id: "values", contentKey: "workWithUs.values", x: 1170, y: 560 }),
        hotspot({ room: "work-with-us", id: "enquire", contentKey: "workWithUs.enquiry", x: 1330, y: 365 }),
        hotspot({ room: "work-with-us", id: "back", action: "back", x: 1430, y: 210 })
      ]
    }
  }
};

/*
 * Fees, Medicare rebates and assessment prices are not written in this file
 * (issue #80). `src/pages/house.astro` builds them from the same sources the
 * plain pages use (src/content/pages/fees.md, src/content/pages/assessments.md
 * and src/data/medicare.js, through src/lib/house-facts.js) and writes them
 * into the page as JSON. Read here, they reach the rooms unchanged, so the
 * house can never quote a figure /fees/ or /assessments/ does not.
 *
 * Outside that page (a test, the Astro build importing this file for the
 * contact details) there is no JSON, and the fee hotspots fall back to the
 * pointer to /fees/ alone.
 */
function readHouseFacts() {
  if (typeof document === "undefined") return {};
  const element = document.getElementById("house-facts");
  if (!element) return {};
  try {
    return JSON.parse(element.textContent) || {};
  } catch {
    return {};
  }
}

export const houseFacts = readHouseFacts();

const packagePrice = (title) => houseFacts.packagePrices?.[title];

/*
 * "Show on the live website" (issue #95). The team, packages and programs in
 * house-copy.json are the house's own copies, so the build cannot filter them
 * the way it filters the collections. /house/ lists instead what this build
 * switches off (production only; the Preview hides nothing):
 *   hidden.team    team collection ids, which are also the `id`s in
 *                  house-copy.json and site-data.js, so renaming someone in
 *                  the CMS does not undo it;
 *   hidden.titles  package and program titles. src/content/pages gives these
 *                  no id, so the title is the link, as it already is for the
 *                  package prices.
 */
const hidden = {
  team: new Set(houseFacts.hidden?.team ?? []),
  titles: new Set(houseFacts.hidden?.titles ?? [])
};

/** Whether the house shows a team member, by their team id. */
export const teamOnSite = (id) => !hidden.team.has(id);

const feesPointer = {
  title: houseCopy.services.feesPointer.title,
  description: houseCopy.services.feesPointer.description,
  link: { href: asset("fees/"), label: houseCopy.services.feesPointer.linkLabel }
};

/*
 * A room's record of what its signs open. The label is the sign's own, from
 * house-rooms.json; `sign` borrows the label of a sign with a different id.
 */
function roomLink(roomId, id, contentKey, { targetRoom, sign = id } = {}) {
  const label = signText(roomId, sign).label;
  return targetRoom ? { id, label, targetRoom, contentKey } : { id, label, contentKey };
}

function roomRecord(id, sourceUrls, hotspots) {
  const { title, exteriorEntry, summary, intro } = roomText(id);
  return intro
    ? { id, title, exteriorEntry, sourceUrls, summary, intro, hotspots }
    : { id, title, exteriorEntry, sourceUrls, summary, hotspots };
}

/* Each philosophy sign opens the principle with its own id, whatever order the principles are saved in. */
const principleSigns = ["holistic-care", "inclusive-environment", "sanctuary", "meaningful-connections", "authenticity"];

function principle(id) {
  const found = houseCopy.philosophy.principles.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`house-copy.json has no philosophy principle with id "${id}"`);
  return { title: found.title, description: found.description };
}

const { assessments, groups, team, library, workWithUs } = houseCopy;
const packages = assessments.packages;

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
    phone: clinic.phone,
    fax: clinic.fax,
    email: clinic.email,
    address: clinic.address,
    bookingUrl: clinic.bookingUrl,
    sourceUrl: asset("contact/"),
    intro: clinic.intro,
    callsToAction: [
      { label: "Book an appointment online", url: clinic.bookingUrl },
      { label: "Call Therapy House", url: phoneHref(clinic.phone) },
      { label: "Email reception", url: `mailto:${clinic.email}` }
    ]
  },

  rooms: {
    exterior: {
      id: "exterior",
      title: roomText("exterior").title,
      summary: roomText("exterior").summary,
      hotspots: exteriorHotspots
    },

    welcome: roomRecord("welcome", [asset("")], [
      roomLink("welcome", "about-team", "team", { targetRoom: "team", sign: "about" }),
      roomLink("welcome", "philosophy", "philosophy"),
      roomLink("welcome", "contact", "contact", { targetRoom: "contact" }),
      /* Not a sign in the room, so never shown; kept as the record of the way back out. */
      { id: "explore-house", label: "Explore The House", targetRoom: "exterior", contentKey: "roomGuide" }
    ]),

    team: roomRecord("team", [asset("team/")], [
      roomLink("team", "team-carousel", "team.members"),
      roomLink("team", "availability", "team.availability"),
      roomLink("team", "therapy-dogs", "team.dogs")
    ]),

    services: roomRecord("services", [asset("therapy/")], [
      roomLink("services", "service-list", "services.offerings"),
      roomLink("services", "therapy-models", "services.therapyModels"),
      roomLink("services", "fees", "services.fees"),
      roomLink("services", "rebates", "services.rebates"),
      roomLink("services", "reports", "services.reports"),
      roomLink("services", "assessment-room", "rooms.assessments", { targetRoom: "assessments" })
    ]),

    assessments: roomRecord("assessments", [
      asset("assessments/"),
      asset("library/what-is-adhd/"),
      asset("library/is-your-child-learning-to-the-best-of-their-capacity/")
    ], [
      roomLink("assessments", "assessment-process", "assessments.process"),
      roomLink("assessments", "assessment-documents", "assessments.documents"),
      roomLink("assessments", "psychoeducational-assessment", "assessments.packages.psychoeducational"),
      roomLink("assessments", "cognitive-assessment", "assessments.packages.cognitive"),
      roomLink("assessments", "adhd-assessment", "assessments.packages.adhd"),
      roomLink("assessments", "autism-assessment", "assessments.packages.autism"),
      roomLink("assessments", "school-observations", "assessments.schoolObservations"),
      roomLink("assessments", "assessment-faq", "assessments.faq")
    ]),

    groups: roomRecord("groups", [asset("group-therapy/")], [
      roomLink("groups", "group-overview", "groups.overview"),
      roomLink("groups", "emotion-regulation", "groups.programs.emotionRegulation"),
      roomLink("groups", "hunter-remote", "groups.programs.hunterRemote"),
      roomLink("groups", "social-relationships", "groups.programs.socialRelationships"),
      roomLink("groups", "lego-club", "groups.programs.legoClub"),
      roomLink("groups", "circle-security", "groups.circleOfSecurity"),
      roomLink("groups", "workshops", "groups.workshops")
    ]),

    library: roomRecord("library", [asset("library/")], [
      roomLink("library", "blogs", "library.blogArticles"),
      roomLink("library", "products", "library.products"),
      roomLink("library", "videos", "library.videos"),
      roomLink("library", "publications", "library.publications"),
      roomLink("library", "media", "library.media"),
      roomLink("library", "attic", "rooms.philosophy")
    ]),

    philosophy: roomRecord("philosophy", [asset("philosophy/")], [
      roomLink("philosophy", "philosophy-overview", "philosophy"),
      ...principleSigns.map((id, index) => roomLink("philosophy", id, `philosophy.principles.${index}`))
    ]),

    contact: roomRecord("contact", [asset("contact/")], [
      roomLink("contact", "book-online", "contact.bookingUrl"),
      roomLink("contact", "phone", "contact.phone"),
      roomLink("contact", "email", "contact.email"),
      roomLink("contact", "address", "contact.address"),
      roomLink("contact", "parking", "contact.intro")
    ]),

    "work-with-us": roomRecord("work-with-us", [asset("work-with-us/")], [
      roomLink("work-with-us", "opportunities", "workWithUs.opportunities"),
      roomLink("work-with-us", "clinic-culture", "workWithUs.culture"),
      roomLink("work-with-us", "values", "workWithUs.values"),
      roomLink("work-with-us", "enquire", "workWithUs.enquiry")
    ])
  },

  philosophy: {
    title: houseCopy.philosophy.title,
    intro: houseCopy.philosophy.intro,
    principles: principleSigns.map(principle),
    closing: houseCopy.philosophy.closing
  },

  services: {
    sourceUrl: asset("therapy/"),
    intro: houseCopy.services.intro,
    offerings: houseCopy.services.offerings,
    therapyModels: houseCopy.services.therapyModels,
    fees: [...(houseFacts.fees ?? []), feesPointer],
    rebates: [...(houseFacts.rebates ?? []), feesPointer],
    reports: houseCopy.services.reports
  },

  /* A package title is also the key into the prices from assessments.md, so it must match the title there. */
  assessments: {
    sourceUrl: asset("assessments/"),
    intro: assessments.intro,
    process: assessments.process,
    documents: assessments.documents,
    packages: {
      psychoeducational: {
        title: packages.psychoeducational.title,
        price: packagePrice(packages.psychoeducational.title),
        inclusions: packages.psychoeducational.inclusions
      },
      cognitive: {
        title: packages.cognitive.title,
        price: packagePrice(packages.cognitive.title),
        description: packages.cognitive.description
      },
      adhd: {
        title: packages.adhd.title,
        price: packagePrice(packages.adhd.title),
        description: packages.adhd.description
      },
      autism: {
        title: packages.autism.title,
        price: packagePrice(packages.autism.title),
        description: packages.autism.description
      }
    },
    schoolObservations: {
      title: assessments.schoolObservations.title,
      price: packagePrice(assessments.schoolObservations.title),
      description: assessments.schoolObservations.description
    },
    faq: assessments.faq
  },

  groups: {
    sourceUrl: asset("group-therapy/"),
    overview: groups.overview,
    // A copy, so switching a program off never edits the shared JSON module.
    programs: { ...groups.programs },
    circleOfSecurity: {
      sourceUrl: asset("group-therapy/"),
      title: groups.circleOfSecurity.title,
      description: groups.circleOfSecurity.description,
      details: groups.circleOfSecurity.details
    },
    workshops: {
      sourceUrl: asset("group-therapy/"),
      title: groups.workshops.title,
      topics: groups.workshops.topics
    }
  },

  /* A team member's `id` is their profile address under /team/. */
  team: {
    sourceUrl: asset("team/"),
    availability: team.availability.filter(({ id }) => teamOnSite(id)).map(({ name, status }) => ({ name, status })),
    // The dogs are listed by name; their id is on their entry in `members`.
    dogs: team.dogs.filter((name) => teamOnSite(team.members.find((member) => member.name === name)?.id)),
    members: team.members.filter(({ id }) => teamOnSite(id)).map(({ id, name, role, credentials, summary }) => ({
      name,
      role,
      sourceUrl: asset(`team/${id}/`),
      credentials,
      summary
    }))
  },

  /* A blog article's `id` is its address under /library/. */
  library: {
    products: library.products.map(({ title, description }) => ({
      title,
      sourceUrl: asset("library/"),
      description
    })),
    videos: {
      sourceUrl: asset("library/"),
      topics: library.videos.topics
    },
    publications: {
      sourceUrl: asset("library/"),
      description: library.publications.description
    },
    media: {
      sourceUrl: asset("library/"),
      items: library.media.items
    },
    blogArticles: library.blogArticles.map(({ id, title, date, excerpt }) => ({
      title,
      slug: id,
      date,
      url: asset(`library/${id}/`),
      excerpt
    }))
  },

  workWithUs: {
    sourceUrl: asset("work-with-us/"),
    values: workWithUs.values,
    culture: workWithUs.culture,
    opportunities: workWithUs.opportunities,
    enquiry: {
      email: clinic.email,
      sourceUrl: asset("work-with-us/")
    }
  }
};

/* Take out the packages and programs this build switches off (see `hidden`
   above), and any room sign that would open one of them. */
if (hidden.titles.size > 0) {
  const removedKeys = new Set();
  const removeFrom = (parent, key, contentKey) => {
    if (!parent[key] || !hidden.titles.has(parent[key].title)) return;
    delete parent[key];
    removedKeys.add(contentKey);
  };
  const { assessments: shownAssessments, groups: shownGroups } = siteContent;
  for (const key of Object.keys(shownAssessments.packages)) {
    removeFrom(shownAssessments.packages, key, `assessments.packages.${key}`);
  }
  removeFrom(shownAssessments, "schoolObservations", "assessments.schoolObservations");
  for (const key of Object.keys(shownGroups.programs)) removeFrom(shownGroups.programs, key, `groups.programs.${key}`);

  for (const rooms of [roomSceneDefaults.rooms, siteContent.rooms]) {
    for (const room of Object.values(rooms)) {
      if (Array.isArray(room.hotspots)) {
        room.hotspots = room.hotspots.filter((spot) => !removedKeys.has(spot.contentKey));
      }
    }
  }
}
