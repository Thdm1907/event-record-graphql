import { ObjectType, Field, Int } from 'type-graphql';

@ObjectType('EventTypeSummary')
export class EventTypeSummary {
  @Field(() => String)
  type!: string;

  @Field(() => Int)
  count!: number;
}

@ObjectType('CountrySummary')
export class CountrySummary {
  @Field(() => String)
  country!: string;

  @Field(() => Int)
  count!: number;
}
