import {
  LocalTerminologyProvider,
  createClinicalCodeTranslator,
  type ClinicalTerminologyTranslationInput,
  type TerminologyCatalogDocument,
  type TerminologySearchInput,
  type TerminologySearchResult,
} from 'gdc-sdk-core-ts';

/**
 * Browser/offline terminology facade backed only by application-loaded JSON
 * catalogs. It never performs network requests.
 */
export class OfflineClinicalTerminology {
  private readonly provider: LocalTerminologyProvider;

  /** Synchronous adapter for `ClinicalResourceDisplayOptions.translateCode`. */
  public readonly translateCode: (
    input: ClinicalTerminologyTranslationInput,
  ) => string | undefined;

  public constructor(catalogs: readonly TerminologyCatalogDocument[]) {
    this.provider = new LocalTerminologyProvider(catalogs);
    this.translateCode = createClinicalCodeTranslator(this.provider);
  }

  /** Searches the loaded fallback catalogs for a coded form control. */
  public search(input: TerminologySearchInput): readonly TerminologySearchResult[] {
    return this.provider.search(input);
  }
}
