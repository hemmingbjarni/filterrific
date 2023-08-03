module Filterrific
  module ActionControllerExtension
    include HasResetFilterrificUrlMixin

    protected

    def initialize_filterrific(model_class, filterrific_params, opts = {})
      f_params = (filterrific_params || {}).stringify_keys
      opts = opts.stringify_keys
      pers_id = if opts["persistence_id"] == false
        nil
      else
        opts["persistence_id"] || compute_default_persistence_id
      end
    
      if f_params.delete("reset_filterrific")
        cookies.delete(pers_id) if pers_id
        redirect_to url_for({}) and return false
      end
    
      f_params = compute_filterrific_params(model_class, f_params, opts, pers_id)
    
      filterrific = Filterrific::ParamSet.new(model_class, f_params)
      filterrific.select_options = opts["select_options"]
    
      # Only set the cookie if filterrific_params is present
      if filterrific_params.present?
        cookies[pers_id] = { value: filterrific.to_hash.to_json, expires: 1.year.from_now } if pers_id
      end
    
      filterrific
    end

    def compute_default_persistence_id
      [controller_name, action_name].join("#")
    end

    def compute_filterrific_params(model_class, filterrific_params, opts, persistence_id)
      opts = {"sanitize_params" => true}.merge(opts.stringify_keys)
      
      existing_params = persistence_id && cookies[persistence_id].present? ? JSON.parse(CGI::unescape(cookies[persistence_id])) : {}
    
      r = (
        existing_params || # start with persisted params in cookies
        filterrific_params.presence || # then try params from the request if persistence_id is present
        opts["default_filter_params"] || # then use passed in opts
        model_class.filterrific_default_filter_params # finally use model_class defaults
      ).stringify_keys
      
      r.slice!(*opts["available_filters"].map(&:to_s)) if opts["available_filters"]
      # Sanitize params to prevent reflected XSS attack
      if opts["sanitize_params"]
        r.each { |k, v| r[k] = sanitize_filterrific_param(r[k]) }
      end
      r
    end

    def sanitize_filterrific_param(val)
      case val
      when Array
        val.map { |e| sanitize_filterrific_param(e) }
      when Hash
        val.each_with_object({}) { |(k, v), m| m[k] = sanitize_filterrific_param(v); }
      when NilClass
        val
      when String
        helpers.sanitize(val)
      else
        val
      end
    end
  end
end
