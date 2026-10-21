export const NextResponse = {
  json: (body: any, init?: any) => new Response(JSON.stringify(body), init),
  next: () => new Response(null),
};
