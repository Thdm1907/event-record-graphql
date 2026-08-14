import { Resolver, Query, Mutation, Arg, Ctx, Int } from 'type-graphql';
import { SiteInfoType } from '../types/SiteInfoType.js';
import { SiteInfoInput } from '../types/SiteInfoInput.js';
import { CountrySummary } from '../types/SummaryTypes.js';
import { GraphQLContext } from '../context/GraphQLContext.js';

@Resolver(() => SiteInfoType)
export class SiteResolver {
  @Query(() => [SiteInfoType])
  async sites(@Ctx() ctx: GraphQLContext): Promise<SiteInfoType[]> {
    return ctx.siteStore.findAll();
  }

  @Query(() => SiteInfoType, { nullable: true })
  async site(
    @Arg('siteId', () => Int) siteId: number,
    @Ctx() ctx: GraphQLContext
  ): Promise<SiteInfoType | null> {
    return ctx.siteStore.findById(siteId);
  }

  @Query(() => [CountrySummary])
  async distinctCountries(@Ctx() ctx: GraphQLContext): Promise<CountrySummary[]> {
    return ctx.siteStore.distinctCountries();
  }

  @Mutation(() => SiteInfoType)
  async createSite(
    @Arg('input') input: SiteInfoInput,
    @Ctx() ctx: GraphQLContext
  ): Promise<SiteInfoType> {
    return ctx.siteStore.insert(input);
  }
}
