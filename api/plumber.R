# plumber.R
# REST API for gsDesign2 R package - Group Sequential Design with Non-Proportional Hazards
# Production-quality Plumber API

library(plumber)
library(jsonlite)
library(gsDesign2)
library(gsDesign)
library(tibble)

# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

`%||%` <- function(x, y) {
  if (!is.null(x) && length(x) > 0 && !identical(x, "")) x else y
}

.toNum <- function(x) {

  if (is.null(x) || (length(x) == 1 && is.na(x))) return(NA_real_)
  as.numeric(x)
}

.toInt <- function(x, default = NA_integer_) {
  if (is.null(x)) return(default)
  as.integer(x)
}

.toBool <- function(x, default = FALSE) {
  if (is.null(x)) return(default)
  isTRUE(as.logical(x))
}

.cleanNum <- function(x) {
  if (is.null(x)) return(NULL)
  x <- as.numeric(x)
  x[is.infinite(x) | is.nan(x)] <- NA_real_
  x
}

.parseVec <- function(x) {
  if (is.null(x) || identical(x, "")) return(NULL)
  as.numeric(strsplit(as.character(x), ",")[[1]])
}

# ---------------------------------------------------------------------------
# Spending function mapper
# ---------------------------------------------------------------------------

get_sf <- function(name) {
  switch(name,
    "sfLDOF"    = gsDesign::sfLDOF,
    "sfLDPocock" = gsDesign::sfLDPocock,
    "sfHSD"     = gsDesign::sfHSD,
    gsDesign::sfLDOF
  )
}

# ---------------------------------------------------------------------------
# Build common enroll_rate / fail_rate tibbles from scalar inputs
# ---------------------------------------------------------------------------

build_enroll_rate <- function(enroll_duration, enroll_rate_value) {
  define_enroll_rate(
    duration = enroll_duration,
    rate     = enroll_rate_value
  )
}

build_fail_rate <- function(median_control, delay_duration, hr_delay,
                            hr_after, dropout_rate) {
  define_fail_rate(
    duration    = c(delay_duration, 100),
    fail_rate   = log(2) / median_control,
    hr          = c(hr_delay, hr_after),
    dropout_rate = dropout_rate
  )
}

# ---------------------------------------------------------------------------
# Clean a data-frame / tibble for JSON output: replace Inf/NaN with NA
# ---------------------------------------------------------------------------

clean_df <- function(df) {
  df <- as.data.frame(df)
  for (col in names(df)) {
    if (is.numeric(df[[col]])) {
      df[[col]] <- .cleanNum(df[[col]])
    }
  }
  df
}

# Rows of a data.frame as a list-of-lists (for JSON arrays-of-objects)
df_to_rowlist <- function(df) {
  df <- clean_df(df)
  lapply(seq_len(nrow(df)), function(i) as.list(df[i, , drop = FALSE]))
}

# Sanitise column names (remove spaces, special chars)
safe_names <- function(df) {
  names(df) <- gsub("[^a-zA-Z0-9_]", "_", names(df))
  df
}

# ---------------------------------------------------------------------------
# CORS filter
# ---------------------------------------------------------------------------

#* @filter cors
function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Requested-With")

  if (req$REQUEST_METHOD == "OPTIONS") {
    res$status <- 200
    return(list())
  }

  plumber::forward()
}

# ===========================================================================
# 1. POST /fixed-design-ahr
# ===========================================================================

#* Fixed Design - Average Hazard Ratio
#* @post /fixed-design-ahr
#* @serializer unboxedJSON
function(req) {
  tryCatch({
    body <- req$body

    alpha           <- .toNum(body$alpha)           %||% 0.025
    power           <- .toNum(body$power)           %||% 0.9
    ratio           <- .toNum(body$ratio)           %||% 1
    study_duration  <- .toNum(body$study_duration)  %||% 36
    enroll_duration <- .toNum(body$enroll_duration) %||% 18
    enroll_rate_value <- .toNum(body$enroll_rate_value) %||% 20
    median_control  <- .toNum(body$median_control)  %||% 12
    delay_duration  <- .toNum(body$delay_duration)  %||% 4
    hr_delay        <- .toNum(body$hr_delay)        %||% 1.0
    hr_after        <- .toNum(body$hr_after)        %||% 0.6
    dropout_rate    <- .toNum(body$dropout_rate)    %||% 0.001

    enroll_rate <- build_enroll_rate(enroll_duration, enroll_rate_value)
    fail_rate   <- build_fail_rate(median_control, delay_duration,
                                   hr_delay, hr_after, dropout_rate)

    result <- fixed_design_ahr(
      alpha          = alpha,
      power          = power,
      ratio          = ratio,
      study_duration = study_duration,
      enroll_rate    = enroll_rate,
      fail_rate      = fail_rate
    )

    analysis <- clean_df(result$analysis)

    rCode <- paste0(
      'library(gsDesign2)\n',
      'enroll_rate <- define_enroll_rate(duration = ', enroll_duration,
        ', rate = ', enroll_rate_value, ')\n',
      'fail_rate <- define_fail_rate(\n',
      '  duration = c(', delay_duration, ', 100),\n',
      '  fail_rate = log(2) / ', median_control, ',\n',
      '  hr = c(', hr_delay, ', ', hr_after, '),\n',
      '  dropout_rate = ', dropout_rate, '\n)\n',
      'result <- fixed_design_ahr(\n',
      '  alpha = ', alpha, ',\n',
      '  power = ', power, ',\n',
      '  ratio = ', ratio, ',\n',
      '  study_duration = ', study_duration, ',\n',
      '  enroll_rate = enroll_rate,\n',
      '  fail_rate = fail_rate\n)\n',
      'result$analysis'
    )

    list(
      status   = "success",
      analysis = df_to_rowlist(analysis),
      rCode    = rCode
    )
  }, error = function(e) {
    list(status = "error", message = conditionMessage(e))
  })
}

# ===========================================================================
# 2. POST /fixed-design-fh
# ===========================================================================

#* Fixed Design - Fleming-Harrington
#* @post /fixed-design-fh
#* @serializer unboxedJSON
function(req) {
  tryCatch({
    body <- req$body

    alpha           <- .toNum(body$alpha)           %||% 0.025
    power           <- .toNum(body$power)           %||% 0.9
    ratio           <- .toNum(body$ratio)           %||% 1
    study_duration  <- .toNum(body$study_duration)  %||% 36
    enroll_duration <- .toNum(body$enroll_duration) %||% 18
    enroll_rate_value <- .toNum(body$enroll_rate_value) %||% 20
    median_control  <- .toNum(body$median_control)  %||% 12
    delay_duration  <- .toNum(body$delay_duration)  %||% 4
    hr_delay        <- .toNum(body$hr_delay)        %||% 1.0
    hr_after        <- .toNum(body$hr_after)        %||% 0.6
    dropout_rate    <- .toNum(body$dropout_rate)    %||% 0.001
    rho             <- .toNum(body$rho)             %||% 0
    gamma           <- .toNum(body$gamma)           %||% 0.5

    enroll_rate <- build_enroll_rate(enroll_duration, enroll_rate_value)
    fail_rate   <- build_fail_rate(median_control, delay_duration,
                                   hr_delay, hr_after, dropout_rate)

    result <- fixed_design_fh(
      alpha          = alpha,
      power          = power,
      ratio          = ratio,
      study_duration = study_duration,
      enroll_rate    = enroll_rate,
      fail_rate      = fail_rate,
      rho            = rho,
      gamma          = gamma
    )

    analysis <- clean_df(result$analysis)

    rCode <- paste0(
      'library(gsDesign2)\n',
      'enroll_rate <- define_enroll_rate(duration = ', enroll_duration,
        ', rate = ', enroll_rate_value, ')\n',
      'fail_rate <- define_fail_rate(\n',
      '  duration = c(', delay_duration, ', 100),\n',
      '  fail_rate = log(2) / ', median_control, ',\n',
      '  hr = c(', hr_delay, ', ', hr_after, '),\n',
      '  dropout_rate = ', dropout_rate, '\n)\n',
      'result <- fixed_design_fh(\n',
      '  alpha = ', alpha, ',\n',
      '  power = ', power, ',\n',
      '  ratio = ', ratio, ',\n',
      '  study_duration = ', study_duration, ',\n',
      '  enroll_rate = enroll_rate,\n',
      '  fail_rate = fail_rate,\n',
      '  rho = ', rho, ',\n',
      '  gamma = ', gamma, '\n)\n',
      'result$analysis'
    )

    list(
      status   = "success",
      analysis = df_to_rowlist(analysis),
      rCode    = rCode
    )
  }, error = function(e) {
    list(status = "error", message = conditionMessage(e))
  })
}

# ===========================================================================
# 3. POST /fixed-design-rd
# ===========================================================================

#* Fixed Design - Risk Difference
#* @post /fixed-design-rd
#* @serializer unboxedJSON
function(req) {
  tryCatch({
    body <- req$body

    alpha <- .toNum(body$alpha) %||% 0.025
    power <- .toNum(body$power) %||% 0.9
    ratio <- .toNum(body$ratio) %||% 1
    p_c   <- .toNum(body$p_c)   %||% 0.2
    p_e   <- .toNum(body$p_e)   %||% 0.15
    rd0   <- .toNum(body$rd0)   %||% 0

    result <- fixed_design_rd(
      alpha = alpha,
      power = power,
      ratio = ratio,
      p_c   = p_c,
      p_e   = p_e,
      rd0   = rd0
    )

    analysis <- clean_df(result$analysis)

    rCode <- paste0(
      'library(gsDesign2)\n',
      'result <- fixed_design_rd(\n',
      '  alpha = ', alpha, ',\n',
      '  power = ', power, ',\n',
      '  ratio = ', ratio, ',\n',
      '  p_c = ', p_c, ',\n',
      '  p_e = ', p_e, ',\n',
      '  rd0 = ', rd0, '\n)\n',
      'result$analysis'
    )

    list(
      status   = "success",
      analysis = df_to_rowlist(analysis),
      rCode    = rCode
    )
  }, error = function(e) {
    list(status = "error", message = conditionMessage(e))
  })
}

# ===========================================================================
# 4. POST /gs-design-ahr
# ===========================================================================

#* Group Sequential Design - Average Hazard Ratio
#* @post /gs-design-ahr
#* @serializer unboxedJSON
function(req) {
  tryCatch({
    body <- req$body

    alpha           <- .toNum(body$alpha)           %||% 0.025
    beta            <- .toNum(body$beta)            %||% 0.1
    ratio           <- .toNum(body$ratio)           %||% 1
    enroll_duration <- .toNum(body$enroll_duration) %||% 12
    enroll_rate_value <- .toNum(body$enroll_rate_value) %||% (500 / 12)
    median_control  <- .toNum(body$median_control)  %||% 12
    delay_duration  <- .toNum(body$delay_duration)  %||% 4
    hr_delay        <- .toNum(body$hr_delay)        %||% 1.0
    hr_after        <- .toNum(body$hr_after)        %||% 0.6
    dropout_rate    <- .toNum(body$dropout_rate)    %||% 0.001
    binding         <- .toBool(body$binding, default = FALSE)
    info_scale      <- (body$info_scale)            %||% "h0_h1_info"

    analysis_time <- .parseVec(body$analysis_time) %||% c(12, 24, 36)
    info_frac     <- .parseVec(body$info_frac)

    upper_spending <- body$upper_spending %||% "sfLDOF"
    upper_param    <- .toNum(body$upper_param) %||% -4
    lower_spending <- body$lower_spending %||% "sfLDOF"
    lower_param    <- .toNum(body$lower_param) %||% -2

    enroll_rate <- build_enroll_rate(enroll_duration, enroll_rate_value)
    fail_rate   <- build_fail_rate(median_control, delay_duration,
                                   hr_delay, hr_after, dropout_rate)

    upar <- list(sf = get_sf(upper_spending), total_spend = alpha,
                 param = upper_param)
    lpar <- list(sf = get_sf(lower_spending), total_spend = beta,
                 param = lower_param)

    call_args <- list(
      alpha         = alpha,
      beta          = beta,
      ratio         = ratio,
      enroll_rate   = enroll_rate,
      fail_rate     = fail_rate,
      analysis_time = analysis_time,
      binding       = binding,
      upper         = gs_spending_bound,
      lower         = gs_spending_bound,
      upar          = upar,
      lpar          = lpar,
      info_scale    = info_scale
    )
    if (!is.null(info_frac)) {
      call_args$info_frac <- info_frac
    }

    result <- do.call(gs_design_ahr, call_args)

    bound_df    <- safe_names(as.data.frame(result$bound))
    analysis_df <- safe_names(as.data.frame(result$analysis))

    bound_list    <- df_to_rowlist(bound_df)
    analysis_list <- df_to_rowlist(analysis_df)

    at_str <- paste0("c(", paste(analysis_time, collapse = ", "), ")")
    if_str <- if (!is.null(info_frac))
                paste0("c(", paste(info_frac, collapse = ", "), ")") else "NULL"

    rCode <- paste0(
      'library(gsDesign2)\nlibrary(gsDesign)\n',
      'enroll_rate <- define_enroll_rate(duration = ', enroll_duration,
        ', rate = ', enroll_rate_value, ')\n',
      'fail_rate <- define_fail_rate(\n',
      '  duration = c(', delay_duration, ', 100),\n',
      '  fail_rate = log(2) / ', median_control, ',\n',
      '  hr = c(', hr_delay, ', ', hr_after, '),\n',
      '  dropout_rate = ', dropout_rate, '\n)\n',
      'upar <- list(sf = ', upper_spending, ', total_spend = ', alpha,
        ', param = ', upper_param, ')\n',
      'lpar <- list(sf = ', lower_spending, ', total_spend = ', beta,
        ', param = ', lower_param, ')\n',
      'result <- gs_design_ahr(\n',
      '  alpha = ', alpha, ',\n',
      '  beta = ', beta, ',\n',
      '  ratio = ', ratio, ',\n',
      '  enroll_rate = enroll_rate,\n',
      '  fail_rate = fail_rate,\n',
      '  analysis_time = ', at_str, ',\n',
      '  info_frac = ', if_str, ',\n',
      '  binding = ', toupper(as.character(binding)), ',\n',
      '  upper = gs_spending_bound,\n',
      '  lower = gs_spending_bound,\n',
      '  upar = upar,\n',
      '  lpar = lpar,\n',
      '  info_scale = "', info_scale, '"\n)\n',
      'result'
    )

    list(
      status   = "success",
      bound    = bound_list,
      analysis = analysis_list,
      rCode    = rCode
    )
  }, error = function(e) {
    list(status = "error", message = conditionMessage(e))
  })
}

# ===========================================================================
# 5. POST /gs-design-wlr
# ===========================================================================

#* Group Sequential Design - Weighted Log-Rank
#* @post /gs-design-wlr
#* @serializer unboxedJSON
function(req) {
  tryCatch({
    body <- req$body

    alpha           <- .toNum(body$alpha)           %||% 0.025
    beta            <- .toNum(body$beta)            %||% 0.1
    ratio           <- .toNum(body$ratio)           %||% 1
    enroll_duration <- .toNum(body$enroll_duration) %||% 12
    enroll_rate_value <- .toNum(body$enroll_rate_value) %||% (500 / 12)
    median_control  <- .toNum(body$median_control)  %||% 12
    delay_duration  <- .toNum(body$delay_duration)  %||% 4
    hr_delay        <- .toNum(body$hr_delay)        %||% 1.0
    hr_after        <- .toNum(body$hr_after)        %||% 0.6
    dropout_rate    <- .toNum(body$dropout_rate)    %||% 0.001
    binding         <- .toBool(body$binding, default = FALSE)
    info_scale      <- (body$info_scale)            %||% "h0_h1_info"

    analysis_time <- .parseVec(body$analysis_time) %||% c(12, 24, 36)
    info_frac     <- .parseVec(body$info_frac)

    upper_spending <- body$upper_spending %||% "sfLDOF"
    upper_param    <- .toNum(body$upper_param) %||% -4
    lower_spending <- body$lower_spending %||% "sfLDOF"
    lower_param    <- .toNum(body$lower_param) %||% -2

    weight_method <- body$weight_method %||% "fh"
    weight_rho    <- .toNum(body$weight_rho)   %||% 0
    weight_gamma  <- .toNum(body$weight_gamma) %||% 0.5
    weight_tau    <- .toNum(body$weight_tau)    %||% -1

    enroll_rate <- build_enroll_rate(enroll_duration, enroll_rate_value)
    fail_rate   <- build_fail_rate(median_control, delay_duration,
                                   hr_delay, hr_after, dropout_rate)

    upar <- list(sf = get_sf(upper_spending), total_spend = alpha,
                 param = upper_param)
    lpar <- list(sf = get_sf(lower_spending), total_spend = beta,
                 param = lower_param)

    weight <- switch(weight_method,
      "logrank" = "logrank",
      "fh"      = list(method = "fh", param = list(rho = weight_rho, gamma = weight_gamma)),
      "mb"      = list(method = "mb", param = list(tau = weight_tau, w_max = 2)),
      "logrank"
    )

    call_args <- list(
      alpha         = alpha,
      beta          = beta,
      ratio         = ratio,
      enroll_rate   = enroll_rate,
      fail_rate     = fail_rate,
      analysis_time = analysis_time,
      binding       = binding,
      upper         = gs_spending_bound,
      lower         = gs_spending_bound,
      upar          = upar,
      lpar          = lpar,
      weight        = weight,
      info_scale    = info_scale
    )
    if (!is.null(info_frac)) {
      call_args$info_frac <- info_frac
    }

    result <- do.call(gs_design_wlr, call_args)

    bound_df    <- safe_names(as.data.frame(result$bound))
    analysis_df <- safe_names(as.data.frame(result$analysis))

    bound_list    <- df_to_rowlist(bound_df)
    analysis_list <- df_to_rowlist(analysis_df)

    at_str <- paste0("c(", paste(analysis_time, collapse = ", "), ")")
    if_str <- if (!is.null(info_frac))
                paste0("c(", paste(info_frac, collapse = ", "), ")") else "NULL"

    weight_str <- switch(weight_method,
      "logrank" = "wlr_weight_1",
      "fh"      = paste0("wlr_weight_fh(rho = ", weight_rho,
                          ", gamma = ", weight_gamma, ")"),
      "mb"      = paste0("wlr_weight_mb(tau = ", weight_tau, ")"),
      paste0("wlr_weight_fh(rho = ", weight_rho,
             ", gamma = ", weight_gamma, ")")
    )

    rCode <- paste0(
      'library(gsDesign2)\nlibrary(gsDesign)\n',
      'enroll_rate <- define_enroll_rate(duration = ', enroll_duration,
        ', rate = ', enroll_rate_value, ')\n',
      'fail_rate <- define_fail_rate(\n',
      '  duration = c(', delay_duration, ', 100),\n',
      '  fail_rate = log(2) / ', median_control, ',\n',
      '  hr = c(', hr_delay, ', ', hr_after, '),\n',
      '  dropout_rate = ', dropout_rate, '\n)\n',
      'upar <- list(sf = ', upper_spending, ', total_spend = ', alpha,
        ', param = ', upper_param, ')\n',
      'lpar <- list(sf = ', lower_spending, ', total_spend = ', beta,
        ', param = ', lower_param, ')\n',
      'result <- gs_design_wlr(\n',
      '  alpha = ', alpha, ',\n',
      '  beta = ', beta, ',\n',
      '  ratio = ', ratio, ',\n',
      '  enroll_rate = enroll_rate,\n',
      '  fail_rate = fail_rate,\n',
      '  analysis_time = ', at_str, ',\n',
      '  info_frac = ', if_str, ',\n',
      '  binding = ', toupper(as.character(binding)), ',\n',
      '  upper = gs_spending_bound,\n',
      '  lower = gs_spending_bound,\n',
      '  upar = upar,\n',
      '  lpar = lpar,\n',
      '  weight = ', weight_str, ',\n',
      '  info_scale = "', info_scale, '"\n)\n',
      'result'
    )

    list(
      status   = "success",
      bound    = bound_list,
      analysis = analysis_list,
      rCode    = rCode
    )
  }, error = function(e) {
    list(status = "error", message = conditionMessage(e))
  })
}

# ===========================================================================
# 6. POST /gs-design-rd
# ===========================================================================

#* Group Sequential Design - Risk Difference
#* @post /gs-design-rd
#* @serializer unboxedJSON
function(req) {
  tryCatch({
    body <- req$body

    alpha <- .toNum(body$alpha) %||% 0.025
    beta  <- .toNum(body$beta)  %||% 0.1
    ratio <- .toNum(body$ratio) %||% 1
    p_c   <- .toNum(body$p_c)   %||% 0.2
    p_e   <- .toNum(body$p_e)   %||% 0.15
    rd0   <- .toNum(body$rd0)   %||% 0
    binding <- .toBool(body$binding, default = FALSE)

    info_frac <- .parseVec(body$info_frac) %||% c(1 / 3, 2 / 3, 1)

    upper_spending <- body$upper_spending %||% "sfLDOF"
    upper_param    <- .toNum(body$upper_param) %||% -4
    lower_spending <- body$lower_spending %||% "sfLDOF"
    lower_param    <- .toNum(body$lower_param) %||% -2

    upar <- list(sf = get_sf(upper_spending), total_spend = alpha,
                 param = upper_param)
    lpar <- list(sf = get_sf(lower_spending), total_spend = beta,
                 param = lower_param)

    p_c_tbl <- tibble::tibble(stratum = "All", rate = p_c)
    p_e_tbl <- tibble::tibble(stratum = "All", rate = p_e)

    result <- gs_design_rd(
      alpha     = alpha,
      beta      = beta,
      ratio     = ratio,
      p_c       = p_c_tbl,
      p_e       = p_e_tbl,
      rd0       = rd0,
      info_frac = info_frac,
      binding   = binding,
      upper     = gs_spending_bound,
      lower     = gs_spending_bound,
      upar      = upar,
      lpar      = lpar
    )

    bound_df    <- safe_names(as.data.frame(result$bound))
    analysis_df <- safe_names(as.data.frame(result$analysis))

    bound_list    <- df_to_rowlist(bound_df)
    analysis_list <- df_to_rowlist(analysis_df)

    if_str <- paste0("c(", paste(info_frac, collapse = ", "), ")")

    rCode <- paste0(
      'library(gsDesign2)\nlibrary(gsDesign)\n',
      'p_c <- tibble::tibble(stratum = "All", rate = ', p_c, ')\n',
      'p_e <- tibble::tibble(stratum = "All", rate = ', p_e, ')\n',
      'upar <- list(sf = ', upper_spending, ', total_spend = ', alpha,
        ', param = ', upper_param, ')\n',
      'lpar <- list(sf = ', lower_spending, ', total_spend = ', beta,
        ', param = ', lower_param, ')\n',
      'result <- gs_design_rd(\n',
      '  alpha = ', alpha, ',\n',
      '  beta = ', beta, ',\n',
      '  ratio = ', ratio, ',\n',
      '  p_c = p_c,\n',
      '  p_e = p_e,\n',
      '  rd0 = ', rd0, ',\n',
      '  info_frac = ', if_str, ',\n',
      '  binding = ', toupper(as.character(binding)), ',\n',
      '  upper = gs_spending_bound,\n',
      '  lower = gs_spending_bound,\n',
      '  upar = upar,\n',
      '  lpar = lpar\n)\n',
      'result'
    )

    list(
      status   = "success",
      bound    = bound_list,
      analysis = analysis_list,
      rCode    = rCode
    )
  }, error = function(e) {
    list(status = "error", message = conditionMessage(e))
  })
}

# ===========================================================================
# 7. POST /gs-power-ahr
# ===========================================================================

#* Group Sequential Power - Average Hazard Ratio
#* @post /gs-power-ahr
#* @serializer unboxedJSON
function(req) {
  tryCatch({
    body <- req$body

    alpha           <- .toNum(body$alpha)           %||% 0.025
    beta            <- .toNum(body$beta)            %||% 0.1
    ratio           <- .toNum(body$ratio)           %||% 1
    enroll_duration <- .toNum(body$enroll_duration) %||% 12
    enroll_rate_value <- .toNum(body$enroll_rate_value) %||% (500 / 12)
    median_control  <- .toNum(body$median_control)  %||% 12
    delay_duration  <- .toNum(body$delay_duration)  %||% 4
    hr_delay        <- .toNum(body$hr_delay)        %||% 1.0
    hr_after        <- .toNum(body$hr_after)        %||% 0.6
    dropout_rate    <- .toNum(body$dropout_rate)    %||% 0.001
    binding         <- .toBool(body$binding, default = FALSE)
    info_scale      <- (body$info_scale)            %||% "h0_h1_info"

    analysis_time <- .parseVec(body$analysis_time) %||% c(12, 24, 36)
    info_frac     <- .parseVec(body$info_frac)
    events        <- .parseVec(body$events)

    upper_spending <- body$upper_spending %||% "sfLDOF"
    upper_param    <- .toNum(body$upper_param) %||% -4
    lower_spending <- body$lower_spending %||% "sfLDOF"
    lower_param    <- .toNum(body$lower_param) %||% -2

    enroll_rate <- build_enroll_rate(enroll_duration, enroll_rate_value)
    fail_rate   <- build_fail_rate(median_control, delay_duration,
                                   hr_delay, hr_after, dropout_rate)

    upar <- list(sf = get_sf(upper_spending), total_spend = alpha,
                 param = upper_param)
    lpar <- list(sf = get_sf(lower_spending), total_spend = beta,
                 param = lower_param)

    call_args <- list(
      ratio         = ratio,
      enroll_rate   = enroll_rate,
      fail_rate     = fail_rate,
      binding       = binding,
      upper         = gs_spending_bound,
      lower         = gs_spending_bound,
      upar          = upar,
      lpar          = lpar,
      info_scale    = info_scale
    )
    if (!is.null(events)) {
      call_args$event <- events
    }
    if (!is.null(analysis_time)) {
      call_args$analysis_time <- analysis_time
    }
    if (!is.null(info_frac)) {
      call_args$info_frac <- info_frac
    }

    result <- do.call(gs_power_ahr, call_args)

    bound_df    <- safe_names(as.data.frame(result$bound))
    analysis_df <- safe_names(as.data.frame(result$analysis))

    bound_list    <- df_to_rowlist(bound_df)
    analysis_list <- df_to_rowlist(analysis_df)

    at_str <- paste0("c(", paste(analysis_time, collapse = ", "), ")")
    ev_str <- if (!is.null(events))
                paste0("c(", paste(events, collapse = ", "), ")") else "NULL"
    if_str <- if (!is.null(info_frac))
                paste0("c(", paste(info_frac, collapse = ", "), ")") else "NULL"

    rCode <- paste0(
      'library(gsDesign2)\nlibrary(gsDesign)\n',
      'enroll_rate <- define_enroll_rate(duration = ', enroll_duration,
        ', rate = ', enroll_rate_value, ')\n',
      'fail_rate <- define_fail_rate(\n',
      '  duration = c(', delay_duration, ', 100),\n',
      '  fail_rate = log(2) / ', median_control, ',\n',
      '  hr = c(', hr_delay, ', ', hr_after, '),\n',
      '  dropout_rate = ', dropout_rate, '\n)\n',
      'upar <- list(sf = ', upper_spending, ', total_spend = ', alpha,
        ', param = ', upper_param, ')\n',
      'lpar <- list(sf = ', lower_spending, ', total_spend = ', beta,
        ', param = ', lower_param, ')\n',
      'result <- gs_power_ahr(\n',
      '  alpha = ', alpha, ',\n',
      '  beta = ', beta, ',\n',
      '  ratio = ', ratio, ',\n',
      '  enroll_rate = enroll_rate,\n',
      '  fail_rate = fail_rate,\n',
      '  event = ', ev_str, ',\n',
      '  analysis_time = ', at_str, ',\n',
      '  info_frac = ', if_str, ',\n',
      '  binding = ', toupper(as.character(binding)), ',\n',
      '  upper = gs_spending_bound,\n',
      '  lower = gs_spending_bound,\n',
      '  upar = upar,\n',
      '  lpar = lpar,\n',
      '  info_scale = "', info_scale, '"\n)\n',
      'result'
    )

    list(
      status   = "success",
      bound    = bound_list,
      analysis = analysis_list,
      rCode    = rCode
    )
  }, error = function(e) {
    list(status = "error", message = conditionMessage(e))
  })
}

# ===========================================================================
# 8. POST /ahr
# ===========================================================================

#* Average Hazard Ratio Exploration
#* @post /ahr
#* @serializer unboxedJSON
function(req) {
  tryCatch({
    body <- req$body

    enroll_duration   <- .toNum(body$enroll_duration)   %||% 12
    enroll_rate_value <- .toNum(body$enroll_rate_value) %||% (500 / 12)
    median_control    <- .toNum(body$median_control)    %||% 12
    delay_duration    <- .toNum(body$delay_duration)    %||% 4
    hr_delay          <- .toNum(body$hr_delay)          %||% 1.0
    hr_after          <- .toNum(body$hr_after)          %||% 0.6
    dropout_rate      <- .toNum(body$dropout_rate)      %||% 0.001
    ratio             <- .toNum(body$ratio)             %||% 1

    total_duration <- .parseVec(body$total_duration) %||%
                        c(6, 12, 18, 24, 30, 36, 42, 48)

    enroll_rate <- build_enroll_rate(enroll_duration, enroll_rate_value)
    fail_rate   <- build_fail_rate(median_control, delay_duration,
                                   hr_delay, hr_after, dropout_rate)

    result <- ahr(
      enroll_rate    = enroll_rate,
      fail_rate      = fail_rate,
      total_duration = total_duration,
      ratio          = ratio
    )

    out_df <- clean_df(as.data.frame(result))

    td_str <- paste0("c(", paste(total_duration, collapse = ", "), ")")

    rCode <- paste0(
      'library(gsDesign2)\n',
      'enroll_rate <- define_enroll_rate(duration = ', enroll_duration,
        ', rate = ', enroll_rate_value, ')\n',
      'fail_rate <- define_fail_rate(\n',
      '  duration = c(', delay_duration, ', 100),\n',
      '  fail_rate = log(2) / ', median_control, ',\n',
      '  hr = c(', hr_delay, ', ', hr_after, '),\n',
      '  dropout_rate = ', dropout_rate, '\n)\n',
      'result <- ahr(\n',
      '  enroll_rate = enroll_rate,\n',
      '  fail_rate = fail_rate,\n',
      '  total_duration = ', td_str, ',\n',
      '  ratio = ', ratio, '\n)\n',
      'result'
    )

    list(
      status = "success",
      data   = df_to_rowlist(out_df),
      rCode  = rCode
    )
  }, error = function(e) {
    list(status = "error", message = conditionMessage(e))
  })
}

# ===========================================================================
# 9. POST /expected-event
# ===========================================================================

#* Expected Events
#* @post /expected-event
#* @serializer unboxedJSON
function(req) {
  tryCatch({
    body <- req$body

    enroll_duration   <- .toNum(body$enroll_duration)   %||% 12
    enroll_rate_value <- .toNum(body$enroll_rate_value) %||% (500 / 12)
    median_control    <- .toNum(body$median_control)    %||% 12
    delay_duration    <- .toNum(body$delay_duration)    %||% 4
    hr_delay          <- .toNum(body$hr_delay)          %||% 1.0
    hr_after          <- .toNum(body$hr_after)          %||% 0.6
    dropout_rate      <- .toNum(body$dropout_rate)      %||% 0.001
    ratio             <- .toNum(body$ratio)             %||% 1
    total_duration    <- .toNum(body$total_duration)    %||% 30

    enroll_rate <- build_enroll_rate(enroll_duration, enroll_rate_value)
    fail_rate   <- build_fail_rate(median_control, delay_duration,
                                   hr_delay, hr_after, dropout_rate)

    result <- expected_event(
      enroll_rate    = enroll_rate,
      fail_rate      = fail_rate,
      total_duration = total_duration
    )

    event_count <- .cleanNum(as.numeric(result))

    rCode <- paste0(
      'library(gsDesign2)\n',
      'enroll_rate <- define_enroll_rate(duration = ', enroll_duration,
        ', rate = ', enroll_rate_value, ')\n',
      'fail_rate <- define_fail_rate(\n',
      '  duration = c(', delay_duration, ', 100),\n',
      '  fail_rate = log(2) / ', median_control, ',\n',
      '  hr = c(', hr_delay, ', ', hr_after, '),\n',
      '  dropout_rate = ', dropout_rate, '\n)\n',
      'expected_event(\n',
      '  enroll_rate = enroll_rate,\n',
      '  fail_rate = fail_rate,\n',
      '  total_duration = ', total_duration, ',\n',
      '  ratio = ', ratio, '\n)'
    )

    list(
      status        = "success",
      expected_event = event_count,
      rCode         = rCode
    )
  }, error = function(e) {
    list(status = "error", message = conditionMessage(e))
  })
}

# ===========================================================================
# 10. POST /expected-time
# ===========================================================================

#* Expected Time to Reach Target Events
#* @post /expected-time
#* @serializer unboxedJSON
function(req) {
  tryCatch({
    body <- req$body

    enroll_duration   <- .toNum(body$enroll_duration)   %||% 12
    enroll_rate_value <- .toNum(body$enroll_rate_value) %||% (500 / 12)
    median_control    <- .toNum(body$median_control)    %||% 12
    delay_duration    <- .toNum(body$delay_duration)    %||% 4
    hr_delay          <- .toNum(body$hr_delay)          %||% 1.0
    hr_after          <- .toNum(body$hr_after)          %||% 0.6
    dropout_rate      <- .toNum(body$dropout_rate)      %||% 0.001
    ratio             <- .toNum(body$ratio)             %||% 1
    target_event      <- .toNum(body$target_event)      %||% 150

    enroll_rate <- build_enroll_rate(enroll_duration, enroll_rate_value)
    fail_rate   <- build_fail_rate(median_control, delay_duration,
                                   hr_delay, hr_after, dropout_rate)

    result <- expected_time(
      enroll_rate  = enroll_rate,
      fail_rate    = fail_rate,
      target_event = target_event,
      ratio        = ratio
    )

    out_df <- clean_df(as.data.frame(result))

    rCode <- paste0(
      'library(gsDesign2)\n',
      'enroll_rate <- define_enroll_rate(duration = ', enroll_duration,
        ', rate = ', enroll_rate_value, ')\n',
      'fail_rate <- define_fail_rate(\n',
      '  duration = c(', delay_duration, ', 100),\n',
      '  fail_rate = log(2) / ', median_control, ',\n',
      '  hr = c(', hr_delay, ', ', hr_after, '),\n',
      '  dropout_rate = ', dropout_rate, '\n)\n',
      'expected_time(\n',
      '  enroll_rate = enroll_rate,\n',
      '  fail_rate = fail_rate,\n',
      '  target_event = ', target_event, ',\n',
      '  ratio = ', ratio, '\n)'
    )

    list(
      status = "success",
      data   = df_to_rowlist(out_df),
      rCode  = rCode
    )
  }, error = function(e) {
    list(status = "error", message = conditionMessage(e))
  })
}

# ===========================================================================
# Health check -- no package calls
# ===========================================================================

#* Health check
#* @get /health
#* @serializer unboxedJSON
function() {
  list(
    status = "ok",
    time   = format(Sys.time(), "%Y-%m-%dT%H:%M:%S%z")
  )
}
