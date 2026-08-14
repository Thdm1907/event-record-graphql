export interface SiteInfo {
  siteId: number;
  siteName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}
