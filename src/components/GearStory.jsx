const storyPanels = [
  {
    image: '/images/editorial/djokovic-moment.webp',
    eyebrow: 'Control under speed',
    title: 'A stable setup keeps the face honest.',
    body: 'When the ball is coming fast, higher control and predictable string response help you redirect pace without spraying depth.',
  },
  {
    image: '/images/editorial/main-cover.jpg',
    eyebrow: 'Explosive timing',
    title: 'Power is useful only when launch stays readable.',
    body: 'Frame stiffness, swingweight, and string tension decide whether extra pace feels easy, wild, or dialed in.',
  },
  {
    image: '/images/editorial/nadal-bw.jpg',
    eyebrow: 'Spin identity',
    title: 'Shape comes from the whole setup.',
    body: 'Open patterns, spin-friendly strings, and tension choice can add bite while preserving the comfort you need to swing freely.',
  },
];

export default function GearStory() {
  return (
    <section className="section-pad bg-slate-50 text-court-ink">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-court-blue">Gear changes the shot</p>
            <h2 className="mt-2 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
              Same player. Different response.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-slate-600 lg:justify-self-end">
            GearVision is built around the relationship between equipment and ball behavior: more bite, easier depth, cleaner feel, safer comfort, or tighter control.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {storyPanels.map((panel, index) => (
            <article key={panel.title} className="editorial-card reveal-card" style={{ '--reveal-delay': `${index * 90}ms` }}>
              <img src={panel.image} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/18 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-court-lime">{panel.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-black leading-tight">{panel.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-200">{panel.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
