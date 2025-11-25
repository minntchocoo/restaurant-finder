export type RestaurantSearchAction = "restaurant_search";

export interface RestaurantSearchParameters {
  query?: string;        // e.g. "sushi"
  near?: string;         // e.g. "downtown Los Angeles"
  ll?: string;           // "lat,lng" (optional)
  min_price?: 1 | 2 | 3 | 4;
  max_price?: 1 | 2 | 3 | 4;
  open_now?: boolean;
}

export interface RestaurantCommand {
  action: RestaurantSearchAction;
  parameters: RestaurantSearchParameters;
}
