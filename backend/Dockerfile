FROM yovanggaanandhika/rust:latest AS builder

WORKDIR /home/app
COPY . .
RUN cargo build --release --locked
RUN mkdir -p /out
RUN cp target/release/app /out/app

FROM alpine:latest AS runner

ENV TZ=Asia/Makassar
ENV HOST=0.0.0.0
ENV UPLOAD_DIR=/home/app/uploads

RUN apk add --no-cache ca-certificates tzdata
RUN mkdir -p /home/app/uploads
RUN chown 10001:10001 /home/app/uploads

WORKDIR /home/app
COPY --from=builder --chown=10001:10001 /out/app /usr/local/bin/app

USER 10001:10001
EXPOSE 50051 50052
ENTRYPOINT ["app"]
