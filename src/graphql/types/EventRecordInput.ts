import { InputType, Field, Int } from 'type-graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

@InputType()
export class EventRecordInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  eventDateTime!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  eventGuid?: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @Field(() => String)
  @IsString()
  metadata!: string;

  @Field(() => Int)
  @IsNumber()
  siteId!: number;
}
