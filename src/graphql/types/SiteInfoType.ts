import { ObjectType, Field, Int, ID } from 'type-graphql';

@ObjectType('SiteInfo')
export class SiteInfoType {
  @Field(() => Int)
  siteId!: number;

  @Field(() => String)
  siteName!: string;

  @Field(() => String)
  addressLine1!: string;

  @Field(() => String, { nullable: true })
  addressLine2?: string | null;

  @Field(() => String)
  city!: string;

  @Field(() => String)
  state!: string;

  @Field(() => String)
  country!: string;

  @Field(() => String)
  postalCode!: string;
}
