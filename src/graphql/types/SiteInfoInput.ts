import { InputType, Field } from 'type-graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class SiteInfoInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  siteName!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  city!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  state!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  country!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  postalCode!: string;
}
