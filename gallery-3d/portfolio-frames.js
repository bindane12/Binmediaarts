export const PORTFOLIO_FRAMES = [
  {
    id: 'who-i-am', title: 'WHO AM I', subtitle: 'Creative Technologist · Builder · Researcher', image: './assets/portfolio/frame1-image.jpg', type: 'identity', status: 'OPEN EXHIBITION',
    intro: 'I explore the intersection of technology, creativity, and human experience.',
    description: 'A personal introduction and overview of my journey — blending creative direction, technical experimentation, and research into real-world applications.', visual: 'orbit', visualLabel: 'A living map of interests',
    sections: [
      {
        heading: 'Who Am I',
        body: [
          'I’m Rubin Danely, an AI-focused creative technologist and builder from Bandung, Indonesia, with a degree in Sport, Leisure & Recreation Business. I transitioned into AI through hands-on work in generative AI, AI evaluation, computer vision, AI-powered products, creative AI workflows, and digital experiences.',
          'I’ve built projects ranging from computer-vision applications and AI learning platforms to node-based generative AI workflows for images, video, and content creation, and I enjoy working between creative direction, experimentation, research, and technology.',
          'As a self-driven, multidisciplinary practitioner, I combine creativity, technology, and research to explore open-ended ideas and turn them into working prototypes and engaging experiences.'
        ]
      },
      { heading: 'Exploration', tags: ['ART', 'AI', 'CREATIVE TECHNOLOGY', 'COMPUTER VISION', 'INTERACTIVE EXPERIENCES', 'LEARNING TECHNOLOGY'] }
    ]
  },
  {
    id: 'questions', title: 'QUESTIONS', subtitle: 'Things I keep coming back to', image: './assets/portfolio/frame2-image.jpg', type: 'questions', status: 'ONGOING INQUIRY',
    intro: 'Questions are the material that connects my work across art, technology, learning, and human experience.',
    description: 'These are not prompts with a single expected answer. They are recurring invitations to look again, test an assumption, and notice what changes when the tool becomes part of the experience.', visual: 'question-field', visualLabel: 'Choose a question to bring forward',
    sections: [{ heading: 'Open questions', questions: [
      'Can AI help humans become more creative without making creativity more similar?',
      'Can technology help people learn without thinking for them?',
      'What happens when digital spaces become places we inhabit rather than screens we look at?',
      'How can machines perceive things differently from humans?',
      'How will AI change the way humans learn, create, play, and experience the world?',
      'What happens when the tool itself becomes intelligent?'
    ] }]
  },
  {
    id: 'experiments', title: 'EXPERIMENTS', subtitle: 'Things I build to understand what technology can do', image: './assets/portfolio/frame3-image.jpg', type: 'research-studio', status: 'RESEARCH STUDIO',
    intro: 'A collection of active directions rather than a project grid. Each is a way to test what a medium can make possible.',
    description: 'The studio stays open-ended. These areas describe what I am trying to understand through making; they do not claim results that have not been tested.', visual: 'signal', visualLabel: 'Signals from the research studio',
    sections: [{ heading: 'Areas of exploration', cards: [
      ['AI IMAGE EXPERIMENTS', 'AI image generation, visual references, prompting, editing, and visual exploration.'],
      ['AI VIDEO', 'AI filmmaking, generated scenes, and visual storytelling.'],
      ['COMPUTER VISION', 'An exploration connected to Acnematch.'],
      ['INTERACTIVE WORLDS', 'An exploration connected to Rubin Danely’s World and this 3D gallery.']
    ] }]
  },
  {
    id: 'art-technology', title: 'ART × TECHNOLOGY', subtitle: 'When the medium becomes computational', image: './assets/portfolio/frame4-image.jpg', type: 'immersive-art', status: 'IMMERSIVE EXHIBITION',
    intro: 'I don’t see technology and art as separate disciplines. Technology changes the medium. Art changes the way we interact with technology.',
    description: 'A brush, a model, a camera, a scene, and a line of code can all become materials for an artwork. The question is how each material changes attention, participation, and meaning.', visual: 'generative-grid', visualLabel: 'Move through the medium',
    sections: [{ heading: 'Working with', tags: ['DIGITAL ART', 'GENERATIVE ART', 'INTERACTIVE ART', 'CREATIVE AI'] }]
  },
  {
    id: 'my-evolution', title: 'MY EVOLUTION', subtitle: 'Different projects. One recurring curiosity.', image: './assets/portfolio/frame5-image.jpg', type: 'journey', status: 'VISUAL JOURNEY',
    intro: 'The work changes shape, but it keeps returning to the relationship between technology and human experience.',
    description: 'This is a visual journey, not a résumé. The sequence shows a widening field of practice while keeping one thread visible: curiosity about how people experience technology.', visual: 'timeline', visualLabel: 'A path that keeps unfolding',
    sections: [
      { heading: 'A continuing path', path: ['Digital Art', 'Creative Technology', 'Design & Human Experience', 'AI', 'Research'] },
      { heading: 'What changed', body: 'Art, technology, AI, research.' },
      { heading: 'What stayed', body: 'Curiosity, creativity, experimentation, human experience.' }
    ]
  }
];

export function renderPortfolioFrame(frame) {
  const section = (item) => {
    const body = item.body
      ? (Array.isArray(item.body)
          ? item.body.map(p => `<p>${p}</p>`).join('')
          : `<p>${item.body}</p>`)
      : '';
    const tags = item.tags ? `<div class="frame-tags">${item.tags.map(tag => `<span>${tag}</span>`).join('')}</div>` : '';
    const questions = item.questions ? `<div class="frame-questions">${item.questions.map(question => `<p>“${question}”</p>`).join('')}</div>` : '';
    const cards = item.cards ? `<div class="frame-cards">${item.cards.map(([title, text]) => `<article><b>${title}</b><span>${text}</span></article>`).join('')}</div>` : '';
    const path = item.path ? `<div class="frame-path">${item.path.map(step => `<span>${step}</span>`).join('<i>→</i>')}</div>` : '';
    return `<section><h3>${item.heading}</h3>${body}${tags}${questions}${cards}${path}</section>`;
  };
  const visual = `<div class="frame-stage ${frame.visual}" tabindex="0" aria-label="${frame.visualLabel}"><div class="stage-orbit"></div><div class="stage-core"></div><div class="stage-label">${frame.visualLabel}</div><button class="stage-action" type="button">Interact</button></div>`;
  return `<div class="frame-modal-inner ${frame.type}"><div class="frame-modal-header"><div><p class="frame-status">${frame.status}</p><h2>${frame.title}</h2><p class="frame-subtitle">${frame.subtitle}</p></div><button type="button" class="frame-close" aria-label="Close exhibition">×</button></div><div class="frame-modal-body">${visual}<p class="frame-intro">${frame.intro}</p><p class="frame-description">${frame.description}</p>${frame.sections.map(section).join('')}</div></div>`;
}
