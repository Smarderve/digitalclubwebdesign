# Media assets

All photographs in `public/images/` are free stock photography downloaded from
[Pexels](https://www.pexels.com/license). They are used as **editorial atmosphere only**.

They are **not** photographs of KIUT Digital Club members, leaders, events, projects or
campus, and the interface never claims that they are. Each page that carries a stock
photograph shows a single small stock-photography note in its hero; in-page figures rely
on alt text instead of captions. Named people in the leadership directory keep their
published text records and initials — no stock portrait is substituted for a real person.

Assets are stored at two widths (`-800.jpg`, `-1600.jpg`) and referenced through
`srcSet`, so smaller viewports do not download the large file.

## Inventory

| File | Pexels ID | Subject | Page / section | Reused? |
| --- | --- | --- | --- | --- |
| `lab/computer-lab-*.jpg` | [30879378](https://www.pexels.com/photo/30879378/) | Students coding in a computer laboratory | Home hero rail A; Learn page band | Yes — home rail and learning page (different crops, same subject area) |
| `lab/lab-rows-*.jpg` | [10638070](https://www.pexels.com/photo/10638070/) | Rows of computers in a university laboratory | About page — what-we-do figures | No |
| `lab/computer-lab-study-*.jpg` | [18265837](https://www.pexels.com/photo/18265837/) | Student working at a lab computer | Home hero rail C | No |
| `lab/library-computers-*.jpg` | [6609459](https://www.pexels.com/photo/6609459/) | Two students at a library computer | Leaders hero | No |
| `learning/developer-portrait-*.jpg` | [12899167](https://www.pexels.com/photo/12899167/) | Developer working at a laptop by a window | About hero | No |
| `learning/developer-desk-*.jpg` | [1181676](https://www.pexels.com/photo/1181676/) | Laptop showing code in a shared workspace | Home hero rail C; Learn hero | Home rail + Learn hero (the hero is the page-specific use) |
| `learning/robotics-demo-*.jpg` | [12499181](https://www.pexels.com/photo/12499181/) | Students demonstrating a humanoid robot | Home hero rail A; Home learning-path panel | Yes — same page, two crops |
| `learning/electronics-workshop-*.jpg` | [33920035](https://www.pexels.com/photo/33920035/) | Hands-on electronics workshop | About — what-we-do figures | No |
| `learning/robotics-workshop-*.jpg` | [33920046](https://www.pexels.com/photo/33920046/) | Students assembling a robot | Topics page band | No |
| `learning/students-presenting-*.jpg` | [16070143](https://www.pexels.com/photo/16070143/) | Students preparing a presentation | Learn page resources band | No |
| `collaboration/duo-laptops-*.jpg` | [17737171](https://www.pexels.com/photo/17737171/) | Two people working on laptops | Home hero rail B; Home join band; Auth layout | Yes — hero rail, join band and sign-in panel |
| `collaboration/team-code-review-*.jpg` | [6804071](https://www.pexels.com/photo/6804071/) | Developers reviewing code together | Projects page band | No |
| `collaboration/coding-team-*.jpg` | [1181260](https://www.pexels.com/photo/1181260/) | Three people working on laptops | News page band | No |
| `collaboration/study-group-*.jpg` | [32074907](https://www.pexels.com/photo/32074907/) | Students collaborating over a laptop | Elections hero; Members students tab | Yes — elections and member directory |
| `campus/campus-arrival-*.jpg` | [31039030](https://www.pexels.com/photo/31039030/) | Students outside a university building | Home — the club figure; Home hero rail B | Yes — same page |
| `campus/students-outdoors-*.jpg` | [7972948](https://www.pexels.com/photo/7972948/) | Students with laptops outdoors | Contact hero | No |
| `campus/two-students-*.jpg` | [5965527](https://www.pexels.com/photo/5965527/) | Two students talking on campus | Home community band; Members alumni tab | Yes — community section and alumni tab |
| `community/graduates-*.jpg` | [17615718](https://www.pexels.com/photo/17615718/) | Two graduates in cap and gown | Members hero; Home hero rail A | Yes — alumni/members hero and hero rail |
| `events/auditorium-*.jpg` | [11329863](https://www.pexels.com/photo/11329863/) | Full auditorium audience | Home hero rail B; Home programme figure | Yes — same page |
| `events/workshop-audience-*.jpg` | [18999565](https://www.pexels.com/photo/18999565/) | Audience at a workshop presentation | Events hero | No |
| `events/workshop-room-*.jpg` | [18999265](https://www.pexels.com/photo/18999265/) | People with laptops in a session | Events archive band | No |
| `events/speaker-*.jpg` | [34774320](https://www.pexels.com/photo/34774320/) | Speaker presenting to an audience | News hero | No |
| `development/code-closeup-*.jpg` | [14553704](https://www.pexels.com/photo/14553704/) | Close view of code on a screen | Home hero rail B; Home blog figure | Yes — same page |
| `development/workspace-flatlay-*.jpg` | [3414792](https://www.pexels.com/photo/3414792/) | Desk with laptop and notebooks | Home hero rail C; Home projects figure | Yes — same page |
| `development/code-screen-*.jpg` | [12899153](https://www.pexels.com/photo/12899153/) | Code on a laptop screen | Blog article band | No |
| `development/pair-programming-*.jpg` | [7988742](https://www.pexels.com/photo/7988742/) | Two developers discussing code | Blogs hero | No |
| `topics/server-room-*.jpg` | [17323801](https://www.pexels.com/photo/17323801/) | Network and server racks | Topics hero | No |
| `projects/phone-ui-*.jpg` | [14158913](https://www.pexels.com/photo/14158913/) | Phone screen showing an app interface | Projects hero; Home hero rail C | Yes — projects hero and home rail |

Photographer credits: the 16 assets sourced in the first pass are credited in the project
history. Pexels no longer exposes photo pages to unauthenticated requests, so the 12
assets added in the redesign correction are recorded by Pexels photo ID and subject only.
The licences below cover both sets.

## Licences

Pexels licence: <https://www.pexels.com/license/> — free to use, no attribution
required, no implying endorsement by the people or brands depicted.

## Composition rules applied

- A photograph is never placed inside a solid-colour card as decoration.
- Hero photography is full-height on desktop (`100svh` minus the header) and 16:9 or 3:4
  crops on mobile.
- The home hero uses a three-column moving composition (adapted from the Preline Digital
  Agency about page): three stacked image columns, unequal widths, moving up/up/down at
  26s / 34s / 22s. On screens below 1024 px it becomes two horizontal bands.
- Reuse is limited to (a) the home hero rails, where the same photographs are the
  composition itself, and (b) a page hero that states the subject area already introduced
  on the home page. No two unrelated page heroes share a photograph.

## Not stored here

- Club logo: `public/brand/digital-club-logo.svg` (existing project asset, unchanged).
- Club gallery photography: none has been supplied. The gallery therefore keeps an
  honest empty state rather than using stock images as club memories.
- Project screenshots: none supplied; project records use typographic covers.
- Leader portraits: none supplied; initials are used instead.
