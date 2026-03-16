/**
 * Attribution Tracker — stores source attribution data per spec Section 6.3.
 */

export interface Attribution {
  url: string;
  author: string;
  publication: string;
  date: Date | null;
  license: string;
  accessTimestamp: Date;
}

export class AttributionTracker {
  private attributions: Map<string, Attribution> = new Map();

  track(attribution: Attribution): void {
    this.attributions.set(attribution.url, attribution);
  }

  get(url: string): Attribution | undefined {
    return this.attributions.get(url);
  }

  getAll(): Attribution[] {
    return Array.from(this.attributions.values());
  }

  hasRequiredFields(attribution: Attribution): boolean {
    return !!(
      attribution.url &&
      attribution.author &&
      attribution.date !== undefined &&
      attribution.license
    );
  }
}
