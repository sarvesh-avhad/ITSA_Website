import { User, Event, Registration } from '@prisma/client';

export type PlaceholderContext = {
  user: User;
  event: Event;
  registration?: Registration | null;
  certificateNumber: string;
  issueDate: Date;
};

type ResolverFn = (context: PlaceholderContext) => string;

export class PlaceholderRegistry {
  private registry: Map<string, ResolverFn> = new Map();

  constructor() {
    this.registerDefaults();
  }

  /**
   * Registers a new placeholder and its resolution logic.
   * @param placeholder The exact string found in the PPTX (e.g., "FullName")
   * @param resolver A function that returns the string value
   */
  public register(placeholder: string, resolver: ResolverFn) {
    this.registry.set(placeholder.toLowerCase(), resolver);
  }

  /**
   * Resolves a specific placeholder using the provided context.
   */
  public resolve(placeholder: string, context: PlaceholderContext): string {
    const key = placeholder.replace(/[<>]/g, '').trim().toLowerCase();
    const resolver = this.registry.get(key);
    
    if (!resolver) {
      // If we don't know how to resolve it, return the original placeholder or empty string
      return `<<${placeholder}>>`;
    }

    try {
      return resolver(context);
    } catch (err) {
      return '';
    }
  }

  /**
   * Bulk resolves a list of detected fields.
   */
  public resolveAll(detectedFields: string[], context: PlaceholderContext): Record<string, string> {
    const resolved: Record<string, string> = {};
    for (const field of detectedFields) {
      resolved[field] = this.resolve(field, context);
    }
    return resolved;
  }

  private registerDefaults() {
    // Standard User Fields
    this.register('FullName', (ctx) => `${ctx.user.firstName || ''} ${ctx.user.lastName || ''}`.trim());
    this.register('FirstName', (ctx) => ctx.user.firstName || '');
    this.register('LastName', (ctx) => ctx.user.lastName || '');
    this.register('Email', (ctx) => ctx.user.email);
    this.register('PRN', (ctx) => ctx.user.prn || '');
    this.register('Branch', (ctx) => ctx.user.branch || '');
    this.register('Year', (ctx) => ctx.user.year ? ctx.user.year.toString() : '');

    // Event Fields
    this.register('EventName', (ctx) => ctx.event.title);
    this.register('EventDate', (ctx) => {
      // Basic formatting, can be enhanced
      const d = new Date(ctx.event.startDate);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    });

    // Certificate Fields
    this.register('CertificateID', (ctx) => ctx.certificateNumber);
    this.register('CertificateNumber', (ctx) => ctx.certificateNumber);
    this.register('IssueDate', (ctx) => {
      return ctx.issueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    });

    // We can easily expand this later for dynamic event-specific metadata (Coordinator Name etc.)
  }
}

export const placeholderRegistry = new PlaceholderRegistry();
