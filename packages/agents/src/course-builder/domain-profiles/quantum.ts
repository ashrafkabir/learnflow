import type { OutlineModule } from '../domain-outline.js';

export function quantumComputingRequiredModules(topic: string): OutlineModule[] {
  // Required structure from Iter72 queue:
  // Intro → Math Foundations → Qubits/Physics → Python → Qiskit → Teleportation →
  // Bernstein–Vazirani → Deutsch → Grover → Shor → Next Steps

  // Keep titles close to required labels but still topic-aware.
  const t = String(topic || 'Quantum Computing').trim();

  return [
    {
      title: 'Intro',
      objective: `Orient the learner: what "${t}" is, what problems it can (and cannot) solve, and how the course will proceed.`,
      lessons: [
        {
          title: 'Why quantum computing is different',
          description:
            'Compare classical bits vs qubits and outline the promise and limits of NISQ-era devices.',
        },
      ],
    },
    {
      title: 'Math Foundations',
      objective:
        'Build the minimum linear algebra and probability needed to read quantum circuits.',
      lessons: [
        {
          title: 'Vectors, matrices, and complex numbers (for QC)',
          description:
            'Review vector spaces, matrix multiplication, and complex amplitudes with tiny numeric examples.',
        },
      ],
    },
    {
      title: 'Qubits/Physics',
      objective:
        'Understand qubits, measurement, and the physical intuition behind quantum states.',
      lessons: [
        {
          title: 'Qubits, measurement, and Bloch-sphere intuition',
          description:
            'Learn state vectors, measurement probabilities, and how physical intuition maps to math.',
        },
      ],
    },
    {
      title: 'Python',
      objective: 'Get enough Python to implement small simulations and read Qiskit examples.',
      lessons: [
        {
          title: 'Python essentials for quantum experiments',
          description:
            'Practice arrays, functions, and a small numeric simulation loop used later in the course.',
        },
      ],
    },
    {
      title: 'Qiskit',
      objective:
        'Build and run quantum circuits using Qiskit, including measurement and simple experiments.',
      lessons: [
        {
          title: 'Your first quantum circuit in Qiskit',
          description:
            'Create a circuit, apply gates, measure, and interpret results (simulator-first).',
        },
      ],
    },
    {
      title: 'Teleportation',
      objective:
        'Learn quantum teleportation as a canonical entanglement + measurement + classical-communication protocol.',
      lessons: [
        {
          title: 'Quantum teleportation, step-by-step',
          description: 'Work through the circuit and verify outcomes with a simulator.',
        },
      ],
    },
    {
      title: 'Bernstein–Vazirani',
      objective:
        'Understand the Bernstein–Vazirani algorithm and what kind of speedup it demonstrates.',
      lessons: [
        {
          title: 'Bernstein–Vazirani: finding a hidden string',
          description:
            'Implement BV and explain why it uses fewer oracle queries than a classical approach.',
        },
      ],
    },
    {
      title: 'Deutsch',
      objective:
        'Understand Deutsch’s problem/algorithm as an early example of quantum advantage via interference.',
      lessons: [
        {
          title: 'Deutsch’s algorithm: constant vs balanced',
          description: 'Build the circuit and interpret interference patterns.',
        },
      ],
    },
    {
      title: 'Grover',
      objective: 'Learn Grover’s search algorithm and amplitude amplification intuition.',
      lessons: [
        {
          title: 'Grover’s algorithm: amplitude amplification',
          description: 'Run a small Grover search example and interpret success probabilities.',
        },
      ],
    },
    {
      title: 'Shor',
      objective:
        'Understand Shor’s algorithm at a conceptual level and why it matters for cryptography.',
      lessons: [
        {
          title: 'Shor’s algorithm: factoring and period finding',
          description:
            'Explain the high-level steps and connect to modular arithmetic and QFT intuition.',
        },
      ],
    },
    {
      title: 'Next Steps',
      objective: 'Consolidate learning and chart a path into deeper quantum computing topics.',
      lessons: [
        {
          title: 'Where to go next in quantum computing',
          description:
            'Error correction, hardware, algorithms, and how to keep practicing with simulators and devices.',
        },
      ],
    },
  ];
}
