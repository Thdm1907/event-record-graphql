import {
  Resolver,
  Query,
  Mutation,
  Subscription,
  FieldResolver,
  Root,
  Arg,
  Ctx,
  Int
} from 'type-graphql';
import { EventRecordType } from '../types/EventRecordType.js';
import { EventRecordInput } from '../types/EventRecordInput.js';
import { SiteInfoType } from '../types/SiteInfoType.js';
import { EventTypeSummary } from '../types/SummaryTypes.js';
import { GraphQLContext } from '../context/GraphQLContext.js';
import { EVENT_RECORDED_TOPIC } from '../../processing/EventRecordService.js';

@Resolver(() => EventRecordType)
export class EventRecordResolver {
  @Query(() => [EventRecordType])
  async events(
    @Arg('skip', () => Int, { defaultValue: 0 }) skip: number,
    @Arg('take', () => Int, { defaultValue: 100 }) take: number,
    @Ctx() ctx: GraphQLContext
  ): Promise<EventRecordType[]> {
    return ctx.eventRecordStore.findAll(skip, take);
  }

  @Query(() => [EventRecordType])
  async eventsByType(
    @Arg('type', () => String) type: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<EventRecordType[]> {
    return ctx.eventRecordStore.findByType(type);
  }

  @Query(() => [EventRecordType])
  async eventsBySite(
    @Arg('siteId', () => Int) siteId: number,
    @Ctx() ctx: GraphQLContext
  ): Promise<EventRecordType[]> {
    return ctx.eventRecordStore.findBySiteId(siteId);
  }

  @Query(() => [EventTypeSummary])
  async distinctEventTypes(@Ctx() ctx: GraphQLContext): Promise<EventTypeSummary[]> {
    return ctx.eventRecordStore.distinctTypes();
  }

  @Mutation(() => EventRecordType)
  async recordEvent(
    @Arg('input') input: EventRecordInput,
    @Ctx() ctx: GraphQLContext
  ): Promise<EventRecordType> {
    return ctx.eventRecordService.record(input);
  }

  @Subscription(() => EventRecordType, {
    topics: EVENT_RECORDED_TOPIC
  })
  onEventRecorded(@Root() payload: EventRecordType): EventRecordType {
    return payload;
  }

  @FieldResolver(() => SiteInfoType, { nullable: true })
  async site(
    @Root() event: EventRecordType,
    @Ctx() ctx: GraphQLContext
  ): Promise<SiteInfoType | null> {
    return ctx.siteLoader.load(event.siteId);
  }
}
