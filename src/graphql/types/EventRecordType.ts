import { ObjectType, Field, ID, Int } from 'type-graphql';
import { SiteInfoType } from './SiteInfoType.js';

@ObjectType('EventRecord')
export class EventRecordType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  description!: string;

  @Field(() => String)
  eventDateTime!: string;

  @Field(() => String)
  eventGuid!: string;

  @Field(() => String)
  eventType!: string;

  @Field(() => String)
  metadata!: string;

  @Field(() => Int)
  siteId!: number;

  @Field(() => SiteInfoType, { nullable: true })
  site?: SiteInfoType | null;

  @Field(() => String)
  createdAt!: string;
}
