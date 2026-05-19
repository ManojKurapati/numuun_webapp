import { QuestionnaireScoringError } from './errors';
import { resolveZone, scoreAssessment } from './scoring';
import { ResponseInput, ScoringDefinition } from './types';

/** A two-domain definition used across most tests. */
function definition(): ScoringDefinition {
  return {
    version: 'v1',
    domains: [
      {
        id: 'communication',
        questionIds: ['c1', 'c2', 'c3'],
        thresholds: { delay: 10, monitoring: 20 },
      },
      {
        id: 'gross_motor',
        questionIds: ['g1', 'g2'],
        thresholds: { delay: 5, monitoring: 15 },
      },
    ],
  };
}

describe('resolveZone', () => {
  const thresholds = { delay: 10, monitoring: 20 };

  it('returns NORMAL at or above the monitoring threshold', () => {
    expect(resolveZone(20, thresholds)).toBe('NORMAL');
    expect(resolveZone(25, thresholds)).toBe('NORMAL');
  });

  it('returns GREY_ZONE between the delay and monitoring thresholds', () => {
    expect(resolveZone(10, thresholds)).toBe('GREY_ZONE');
    expect(resolveZone(19, thresholds)).toBe('GREY_ZONE');
  });

  it('returns DELAY below the delay threshold', () => {
    expect(resolveZone(9, thresholds)).toBe('DELAY');
    expect(resolveZone(0, thresholds)).toBe('DELAY');
  });
});

describe('scoreAssessment', () => {
  it('scores domains with default weights and reports zones', () => {
    const responses: ResponseInput[] = [
      { questionId: 'c1', value: 'YES' }, // 10
      { questionId: 'c2', value: 'YES' }, // 10
      { questionId: 'c3', value: 'SOMETIMES' }, // 5  -> 25 NORMAL
      { questionId: 'g1', value: 'NOT_YET' }, // 0
      { questionId: 'g2', value: 'NOT_YET' }, // 0  -> 0  DELAY
    ];

    const result = scoreAssessment(definition(), responses);

    expect(result.version).toBe('v1');
    expect(result.domainScores).toEqual([
      { domainId: 'communication', rawScore: 25, maxScore: 30, zone: 'NORMAL' },
      { domainId: 'gross_motor', rawScore: 0, maxScore: 20, zone: 'DELAY' },
    ]);
    expect(result.totalScore).toBe(25);
    expect(result.totalMaxScore).toBe(50);
    expect(result.overallZone).toBe('DELAY');
  });

  it('is deterministic for identical input', () => {
    const responses: ResponseInput[] = [
      { questionId: 'c1', value: 'SOMETIMES' },
      { questionId: 'c2', value: 'SOMETIMES' },
      { questionId: 'c3', value: 'SOMETIMES' },
      { questionId: 'g1', value: 'YES' },
      { questionId: 'g2', value: 'YES' },
    ];
    expect(scoreAssessment(definition(), responses)).toEqual(
      scoreAssessment(definition(), responses),
    );
  });

  it('derives the overall zone from the most severe domain', () => {
    const responses: ResponseInput[] = [
      { questionId: 'c1', value: 'YES' },
      { questionId: 'c2', value: 'YES' },
      { questionId: 'c3', value: 'NOT_YET' }, // 20 -> NORMAL
      { questionId: 'g1', value: 'SOMETIMES' },
      { questionId: 'g2', value: 'SOMETIMES' }, // 10 -> GREY_ZONE
    ];
    expect(scoreAssessment(definition(), responses).overallZone).toBe('GREY_ZONE');
  });

  it('honours per-questionnaire response weight overrides', () => {
    const def: ScoringDefinition = {
      version: 'v2',
      responseScores: { YES: 2, SOMETIMES: 1, NOT_YET: 0 },
      domains: [
        { id: 'd1', questionIds: ['q1', 'q2'], thresholds: { delay: 1, monitoring: 3 } },
      ],
    };
    const result = scoreAssessment(def, [
      { questionId: 'q1', value: 'YES' },
      { questionId: 'q2', value: 'SOMETIMES' },
    ]);
    expect(result.domainScores[0]).toEqual({
      domainId: 'd1',
      rawScore: 3,
      maxScore: 4,
      zone: 'NORMAL',
    });
  });

  it('throws when the definition has no domains', () => {
    expect(() => scoreAssessment({ version: 'v1', domains: [] }, [])).toThrow(
      QuestionnaireScoringError,
    );
  });

  it('throws when a domain has no questions', () => {
    const def: ScoringDefinition = {
      version: 'v1',
      domains: [{ id: 'd1', questionIds: [], thresholds: { delay: 0, monitoring: 0 } }],
    };
    expect(() => scoreAssessment(def, [])).toThrow(/no questions/);
  });

  it('throws when thresholds are inverted', () => {
    const def: ScoringDefinition = {
      version: 'v1',
      domains: [{ id: 'd1', questionIds: ['q1'], thresholds: { delay: 20, monitoring: 5 } }],
    };
    expect(() => scoreAssessment(def, [{ questionId: 'q1', value: 'YES' }])).toThrow(
      /delay threshold above/,
    );
  });

  it('throws when a question appears in two domains', () => {
    const def: ScoringDefinition = {
      version: 'v1',
      domains: [
        { id: 'd1', questionIds: ['shared'], thresholds: { delay: 0, monitoring: 10 } },
        { id: 'd2', questionIds: ['shared'], thresholds: { delay: 0, monitoring: 10 } },
      ],
    };
    expect(() => scoreAssessment(def, [])).toThrow(/more than one domain/);
  });

  it('throws on a missing response', () => {
    expect(() =>
      scoreAssessment(definition(), [
        { questionId: 'c1', value: 'YES' },
        { questionId: 'c2', value: 'YES' },
        { questionId: 'c3', value: 'YES' },
        { questionId: 'g1', value: 'YES' },
      ]),
    ).toThrow(/Missing response for question "g2"/);
  });

  it('throws on a duplicate response', () => {
    expect(() =>
      scoreAssessment(definition(), [
        { questionId: 'c1', value: 'YES' },
        { questionId: 'c1', value: 'NOT_YET' },
      ]),
    ).toThrow(/answered more than once/);
  });

  it('throws on a response to an unknown question', () => {
    expect(() =>
      scoreAssessment(definition(), [{ questionId: 'does-not-exist', value: 'YES' }]),
    ).toThrow(/unknown question/);
  });

  it('throws on an invalid response value', () => {
    expect(() =>
      scoreAssessment(definition(), [
        // Simulates unvalidated input crossing the boundary.
        { questionId: 'c1', value: 'MAYBE' as unknown as 'YES' },
      ]),
    ).toThrow(/Invalid response value/);
  });

  it('exposes a stable error code on the thrown error', () => {
    try {
      scoreAssessment({ version: 'v1', domains: [] }, []);
      fail('expected scoreAssessment to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(QuestionnaireScoringError);
      expect((error as QuestionnaireScoringError).code).toBe('NO_DOMAINS');
    }
  });
});
