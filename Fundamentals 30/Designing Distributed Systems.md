From the book "Designing Distributed Systems" by Brendan Burns, 2025 Second Edition.

There is already a branch out from the beginning of the book.
You need familiarity with containers and container orchestration systems:

- Docker
- Kubernetes
- DC/OS

tiny url/ url shortner
a single instance db can't handle up to 10k rps. jotit: how many thousand rps in cv?
how would the browser no in terms of redirect?
what redirect caches?
hhtp has caching built in
tightly coupled
api gateway is a reverse proxy. what is it's usecase?
why would we want analytics? to know how often the links/short url are used? - because the short urls will go through your service for a redirect
what's the purpose of short urls?
reddis - single threaded
ACID
SPOF
collissions / retries
md5/sha 256 - hash
what is throughput?
db indexes
read replica
multi-leader dbs
sharding
latecny and throughput and storage size related but not correlated?
reading too much from a db will slow things down?
in-memory store
bloom filter
http or grpc [trpc] rpc
