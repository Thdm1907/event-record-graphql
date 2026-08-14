import { gql } from '@apollo/client';

export const GET_EVENTS = gql`
  query GetEvents($skip: Int, $take: Int) {
    events(skip: $skip, take: $take) {
      id
      description
      eventDateTime
      eventGuid
      eventType
      metadata
      siteId
      createdAt
      site {
        siteId
        siteName
        city
        country
      }
    }
  }
`;

export const GET_SITES = gql`
  query GetSites {
    sites {
      siteId
      siteName
      addressLine1
      addressLine2
      city
      state
      country
      postalCode
    }
  }
`;

export const GET_METRICS_SUMMARY = gql`
  query GetMetricsSummary {
    distinctEventTypes {
      type
      count
    }
    distinctCountries {
      country
      count
    }
  }
`;

export const RECORD_EVENT = gql`
  mutation RecordEvent($input: EventRecordInput!) {
    recordEvent(input: $input) {
      id
      description
      eventDateTime
      eventGuid
      eventType
      metadata
      siteId
      createdAt
    }
  }
`;

export const CREATE_SITE = gql`
  mutation CreateSite($input: SiteInfoInput!) {
    createSite(input: $input) {
      siteId
      siteName
      addressLine1
      city
      state
      country
      postalCode
    }
  }
`;

export const ON_EVENT_RECORDED = gql`
  subscription OnEventRecorded {
    onEventRecorded {
      id
      description
      eventDateTime
      eventGuid
      eventType
      metadata
      siteId
      createdAt
      site {
        siteId
        siteName
        city
      }
    }
  }
`;
