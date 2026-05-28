export const frameCount = 48;

export const frames = Array.from({ length: frameCount }, (_, index) => {
  const number = String(index + 1).padStart(3, "0");
  return `assets/turntable/turntable_${number}.webp`;
});

export const insideImageSize = { width: 1672, height: 940 };

export const insideEdgeFallbackColors = {
  top: "#34231a",
  right: "#2d211a",
  bottom: "#24170f",
  left: "#31231b"
};

export const insideParallaxDepths = [
  { x: -3, y: 0 },
  { x: 5, y: 0 },
  { x: 14, y: 1.5 }
];

export const signPositionStorageKey = "therapyHouse.signPositions.v1";
export const signPositionDownloadName = "therapyhouse-button-positions.json";

export const signPositionFields = [
  { key: "x", datasetKey: "x", label: "data-x", min: 0, max: insideImageSize.width, step: 1 },
  { key: "y", datasetKey: "y", label: "data-y", min: 0, max: insideImageSize.height, step: 1 },
  { key: "perspective", datasetKey: "perspective", label: "data-perspective", min: 160, max: 2000, step: 10 },
  { key: "depth", datasetKey: "depth", label: "data-depth", min: -200, max: 220, step: 1 },
  { key: "rotateX", datasetKey: "rotateX", label: "data-rotate-x", min: -70, max: 70, step: 0.1 },
  { key: "rotateY", datasetKey: "rotateY", label: "data-rotate-y", min: -70, max: 70, step: 0.1 },
  { key: "rotate", datasetKey: "rotate", label: "data-rotate", min: -45, max: 45, step: 0.1 },
  { key: "skewX", datasetKey: "skewX", label: "data-skew-x", min: -35, max: 35, step: 0.1 },
  { key: "skewY", datasetKey: "skewY", label: "data-skew-y", min: -35, max: 35, step: 0.1 },
  { key: "scale", datasetKey: "scale", label: "data-scale", min: 0.3, max: 1.6, step: 0.01 },
  { key: "scaleX", datasetKey: "scaleX", label: "data-scale-x", min: 0.3, max: 1.8, step: 0.01 },
  { key: "scaleY", datasetKey: "scaleY", label: "data-scale-y", min: 0.3, max: 1.8, step: 0.01 }
];

export const teamMembers = [
  {
    name: "Dr Amelia Shay",
    role: "Director, Developmental Psychologist",
    image: "assets/team/amelia-shay.webp",
    imageAlt: "Portrait of Dr Amelia Shay, developmental psychologist at Therapy House in Brisbane",
    summary: "Amelia works with adults and brings long experience across private clinics, hospitals, universities, research and public education.",
    bio: "Amelia has worked in psychology since the early 2000s and holds several psychology qualifications, including a PhD in Developmental Psychology. Her therapy work includes individual therapy, couples counselling, EMDR-informed trauma work, and support in English and Persian/Farsi."
  },
  {
    name: "Dr Kaya Beinke",
    role: "Clinical Psychologist, Chief Clinical Officer",
    image: "assets/team/kaya-beinke.webp",
    imageAlt: "Portrait of Dr Kaya Beinke, clinical psychologist at Therapy House in Brisbane",
    summary: "Kaya supports children, young people and families, with strong experience in clinical psychology, supervision and complex health and developmental presentations.",
    bio: "Kaya trained as a clinical psychologist and is a board approved supervisor. Her practice draws on approaches including CBT, trauma-focused CBT, ACT, DBT and Dyadic Developmental Psychotherapy, with experience across chronic health, developmental delay, assessment and family support."
  },
  {
    name: "Letitia McVey",
    role: "Psychologist, Educational and Developmental Registrar, Chief Operating Officer",
    image: "assets/team/letitia-mcvey.webp",
    imageAlt: "Portrait of Letitia McVey, psychologist and educational and developmental registrar at Therapy House",
    summary: "Letitia is a warm, collaborative practitioner who works with children, adolescents and adults, with a focus on resilience, strengths and hope.",
    bio: "Letitia supports neurodevelopmental differences, learning difficulties, autism, ADHD, anxiety, depression, trauma and specific phobias. Her style is attachment-informed, creative and non-judgemental, with parents involved where useful for wrap-around support."
  },
  {
    name: "Sahar Fattahi",
    role: "Psychologist",
    image: "assets/team/sahar-fattahi.webp",
    imageAlt: "Portrait of Sahar Fattahi, psychologist at Therapy House",
    summary: "Sahar works across the lifespan and brings cross-cultural clinical experience from Australia, Iran and the Philippines.",
    bio: "Sahar has experience with mood and anxiety concerns, diagnostic assessment, neurodevelopmental conditions, emotional and behavioural dysregulation, and parent coaching. She uses approaches such as CBT, ACT and DBT, and can work in English, Persian/Farsi and Filipino/Tagalog."
  },
  {
    name: "Rani Banks",
    role: "Clinical Psychologist",
    image: "assets/team/rani-banks.webp",
    imageAlt: "Portrait of Rani Banks, clinical psychologist at Therapy House",
    summary: "Rani works with people across the lifespan and has experience in regional and rural communities.",
    bio: "Rani provides assessment and therapy for concerns including anxiety, low mood, trauma, learning difficulties, ADHD, autism, relationship and family challenges, anger, bullying and identity questions. Their practice is neuroaffirming, trauma-informed and attentive to wider cultural and social context."
  },
  {
    name: "Jazmin Squire",
    role: "Psychologist",
    image: "assets/team/jazmin-squire.webp",
    imageAlt: "Portrait of Jazmin Squire, psychologist at Therapy House",
    summary: "Jazmin is a warm and engaging clinician who works flexibly with people of all ages.",
    bio: "Jazmin values safe therapeutic relationships and believes people can build insight, skills and more fulfilling ways of living. She has experience with children, young people, parents and couples, including complex trauma, grief, domestic and family violence, depression, anxiety and emotional dysregulation."
  },
  {
    name: "Laura Storey",
    role: "Counsellor",
    image: "assets/team/laura-storey.webp",
    imageAlt: "Portrait of Laura Storey, counsellor at Therapy House",
    summary: "Laura works in a person-centred, trauma-informed and neuroaffirming way, particularly with adolescents and young adults.",
    bio: "Laura has worked in mental health since 2011 and also practices in the eating disorder field. Her work draws on developmental psychology, narrative therapy, schema therapy, feminist frameworks, ACT, grief and loss frameworks, and a strong commitment to safety, trust and humour."
  },
  {
    name: "Genevieve Hussey",
    role: "Provisional Psychologist",
    image: "assets/team/genevieve-hussey.webp",
    imageAlt: "Portrait of Genevieve Hussey, provisional psychologist at Therapy House",
    summary: "Genevieve is a warm clinician focused on supporting young people and families through early intervention.",
    bio: "Gen has experience supporting children with autism-related needs and brings a background in nursing and psychology. She has worked as a Mental Health Registered Nurse in a private psychiatric hospital and values multidisciplinary, compassionate care."
  },
  {
    name: "Natasha",
    role: "Client Support and Marketing Coordinator",
    image: "assets/team/natasha.webp",
    imageAlt: "Portrait of Natasha, client support and marketing coordinator at Therapy House",
    summary: "Natasha is part of the client support team and helps create a warm welcome into the clinic.",
    bio: "Natasha has backgrounds in business, creative industries, public relations and marketing. She supports Therapy House clients and contributes to print, digital and community marketing while also studying psychological science."
  },
  {
    name: "Josie",
    role: "Administrative Support",
    image: "assets/team/josie.webp",
    imageAlt: "Portrait of Josie, administrative support team member at Therapy House",
    summary: "Josie supports the administrative side of Therapy House.",
    bio: "Josie is listed by Therapy House as administrative support. Her role helps the broader team keep the clinic experience organised and welcoming."
  },
  {
    name: "Reea",
    role: "Therapy House dog",
    image: "assets/team/reea.webp",
    imageAlt: "Photo of Reea, the Therapy House dog",
    summary: "Reea brings calm energy and a friendly presence to the Therapy House team.",
    bio: "Reea previously travelled as a show dog and is now on the path to becoming a therapy dog. Therapy House notes that she is not a certified therapy dog and asks visitors to speak with reception if they have any concerns."
  },
  {
    name: "Samson",
    role: "Retired Therapy House dog",
    image: "assets/team/samson.webp",
    imageAlt: "Photo of Samson, retired Therapy House dog",
    summary: "Samson is remembered by Therapy House as a much-loved presence who helped visitors feel safe.",
    bio: "Therapy House describes Samson as calm, attentive and non-judgemental, with many years of experience charming visitors and children at the clinic. The team honours him warmly on the site."
  }
];
