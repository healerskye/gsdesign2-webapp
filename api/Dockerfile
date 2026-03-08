FROM rocker/r-ver:4.4

# System dependencies — full set required for plumber and most R packages
# DO NOT reduce this list — missing libs cause silent install failures
RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    libsodium-dev \
    libfontconfig1-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libfreetype6-dev \
    libpng-dev \
    libtiff5-dev \
    libjpeg-dev \
    && rm -rf /var/lib/apt/lists/*

# Install plumber — verbose so failures are visible in build logs
RUN R -e " \
  options(repos=c(CRAN='https://cloud.r-project.org')); \
  install.packages('plumber', verbose=TRUE, INSTALL_opts='--no-test-load'); \
  cat('plumber installed:', requireNamespace('plumber', quietly=TRUE), '\n')"

# Verify plumber installed — fail build immediately if not
RUN R -e "if (!requireNamespace('plumber', quietly=TRUE)) stop('plumber not installed') else cat('plumber OK\n')"

# Install jsonlite
RUN R -e "install.packages('jsonlite', repos='https://cloud.r-project.org')"

# Install gsDesign2 and its dependencies
RUN R -e " \
  options(repos=c(CRAN='https://cloud.r-project.org')); \
  install.packages(c('gsDesign2', 'gsDesign', 'tibble'), verbose=TRUE); \
  if (!requireNamespace('gsDesign2', quietly=TRUE)) stop('gsDesign2 failed')"

# Verify ALL packages load — build fails here if anything is broken
# This prevents deploying a broken image to Fly.io
RUN R -e "library(plumber); library(jsonlite); library(gsDesign2); library(gsDesign); library(tibble); cat('All packages OK\n')"

WORKDIR /api
COPY plumber.R .

EXPOSE 8080

CMD ["Rscript", "-e", "port <- as.integer(Sys.getenv('PORT', '8080')); plumber::plumb('plumber.R')$run(host='0.0.0.0', port=port)"]
