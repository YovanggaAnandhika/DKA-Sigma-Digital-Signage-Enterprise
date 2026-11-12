FROM yovanggaanandhika/rust:latest AS builder

ARG TARGETARCH
ENV CARGO_TARGET_DIR=/tmp/cargo-target-${TARGETARCH}

WORKDIR /home/app
COPY . .
RUN cargo build --release --locked
RUN mkdir -p /out
RUN cp ${CARGO_TARGET_DIR}/release/app /out/app

FROM alpine:latest AS runner

ENV TZ=Asia/Makassar
ENV HOST=0.0.0.0
ENV UPLOAD_DIR=/home/app/uploads

RUN apk add --no-cache ca-certificates tzdata
RUN addgroup -S -g 10001 app
RUN adduser -S -D -H -u 10001 -G app -s /bin/sh app
RUN mkdir -p /home/app/uploads
RUN chown 10001:10001 /home/app/uploads

WORKDIR /home/app
COPY --from=builder --chown=10001:10001 /out/app /home/app/app

USER 10001:10001
ENTRYPOINT ["./app"]
