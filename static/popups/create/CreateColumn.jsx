import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { closeChart } from "../../actions/charts";
import { buildURLString, dtypesUrl } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import { CreateBins, validateBinsCfg } from "./CreateBins";
import { CreateDatetime, validateDatetimeCfg } from "./CreateDatetime";
import { CreateNumeric, validateNumericCfg } from "./CreateNumeric";
import { CreateRandom, validateRandomCfg } from "./CreateRandom";
import { CreateTransform, validateTransformCfg } from "./CreateTransform";
import { CreateTypeConversion, validateTypeConversionCfg } from "./CreateTypeConversion";
import { CreateWinsorize, validateWinsorizeCfg } from "./CreateWinsorize";
import Descriptions from "./creation-descriptions.json";

require("./CreateColumn.css");

const TYPES = ["numeric", "bins", "datetime", "random", "type_conversion", "transform", "winsorize"];

function buildLabel(v) {
  return _.join(_.map(_.split(v, "_"), _.capitalize), " ");
}

const BASE_STATE = {
  type: "numeric",
  name: "",
  cfg: null,
  code: {},
  loadingColumns: true,
  loadingColumn: false,
};

class ReactCreateColumn extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.assign({}, BASE_STATE);
    this.save = this.save.bind(this);
    this.renderBody = this.renderBody.bind(this);
    this.renderCode = this.renderCode.bind(this);
  }

  componentDidMount() {
    fetchJson(dtypesUrl(this.props.dataId), dtypesData => {
      const newState = { error: null, loadingColumns: false };
      if (dtypesData.error) {
        this.setState({ error: <RemovableError {...dtypesData} /> });
        return;
      }
      newState.columns = dtypesData.dtypes;
      this.setState(newState);
    });
  }

  save() {
    const { name, type, cfg } = this.state;
    if (name === "") {
      this.setState({ error: <RemovableError error="Name is required!" /> });
      return;
    }
    if (_.find(this.state.columns, { name })) {
      this.setState({
        error: <RemovableError error={`The column '${name}' already exists!`} />,
      });
      return;
    }
    let error = null;
    switch (type) {
      case "datetime":
        error = validateDatetimeCfg(cfg);
        break;
      case "bins":
        error = validateBinsCfg(cfg);
        break;
      case "random":
        error = validateRandomCfg(cfg);
        break;
      case "type_conversion":
        error = validateTypeConversionCfg(cfg);
        break;
      case "transform":
        error = validateTransformCfg(cfg);
        break;
      case "winsorize":
        error = validateWinsorizeCfg(cfg);
        break;
      case "numeric":
      default:
        error = validateNumericCfg(cfg);
        break;
    }
    if (!_.isNull(error)) {
      this.setState({ error: <RemovableError error={error} /> });
      return;
    }
    this.setState({ loadingColumn: true });
    const createParams = { name, type, cfg: JSON.stringify(cfg) };
    fetchJson(buildURLString(`/dtale/build-column/${this.props.dataId}?`, createParams), data => {
      if (data.error) {
        this.setState({
          error: <RemovableError {...data} />,
          loadingColumn: false,
        });
        return;
      }
      this.setState({ loadingColumn: false }, () => {
        if (_.startsWith(window.location.pathname, "/dtale/popup/build")) {
          window.opener.location.reload();
          window.close();
        } else {
          this.props.chartData.propagateState({ refresh: true }, this.props.onClose);
        }
      });
    });
  }

  renderBody() {
    const updateState = state => {
      if (_.has(state, "code")) {
        state.code = _.assign({}, this.state.code, {
          [this.state.type]: state.code,
        });
      }
      this.setState(state);
    };
    let body = null;
    switch (this.state.type) {
      case "numeric":
        body = <CreateNumeric columns={this.state.columns} updateState={updateState} />;
        break;
      case "datetime":
        body = <CreateDatetime columns={this.state.columns} updateState={updateState} />;
        break;
      case "bins":
        body = <CreateBins columns={this.state.columns} updateState={updateState} />;
        break;
      case "random":
        body = <CreateRandom updateState={updateState} />;
        break;
      case "type_conversion":
        body = <CreateTypeConversion columns={this.state.columns} updateState={updateState} />;
        break;
      case "transform":
        body = <CreateTransform columns={this.state.columns} updateState={updateState} />;
        break;
      case "winsorize":
        body = <CreateWinsorize columns={this.state.columns} updateState={updateState} />;
        break;
    }
    return (
      <div key="body" className="modal-body">
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Name</label>
          <div className="col-md-8">
            <input
              type="text"
              className="form-control"
              value={this.state.name || ""}
              onChange={e => this.setState({ name: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Column Type</label>
          <div className="col-md-8 builders">
            {_.map(_.chunk(TYPES, 6), (typeRow, i) => (
              <div key={i} className="btn-group row ml-0">
                {_.map(typeRow, (type, j) => {
                  const buttonProps = { className: "btn" };
                  if (type === this.state.type) {
                    buttonProps.className += " btn-primary active";
                  } else {
                    buttonProps.className += " btn-primary inactive";
                    const updatedState = { type };
                    if (type === "random") {
                      updatedState.cfg = { type: "float" };
                    }
                    buttonProps.onClick = () => this.setState(updatedState);
                  }
                  return (
                    <button key={`${i}-${j}`} {...buttonProps}>
                      {buildLabel(type)}
                    </button>
                  );
                })}
              </div>
            ))}
            <label className="col-auto col-form-label pl-3 pr-3 row" style={{ fontSize: "85%" }}>
              {_.get(Descriptions, this.state.type, "")}
            </label>
          </div>
        </div>
        {body}
      </div>
    );
  }

  renderCode() {
    if (_.get(this.state, ["code", this.state.type])) {
      const code = _.concat(_.get(this.state, ["code", this.state.type], []), []);
      let markup = null;
      if (_.size(code) > 2) {
        markup = (
          <div className="font-weight-bold hoverable">
            <div>{code[0]}</div>
            <div>{code[1]}</div>
            <div style={{ fontSize: "85%" }}>{"hover to see more..."}</div>
            <div className="hoverable__content build-code" style={{ width: "auto" }}>
              <pre className="mb-0">{_.join(code, "\n")}</pre>
            </div>
          </div>
        );
      } else {
        markup = (
          <div className="font-weight-bold">
            {_.map(code, (c, i) => (
              <div key={i}>{c}</div>
            ))}
          </div>
        );
      }
      return (
        <div className="col" style={{ paddingRight: 0 }}>
          <span className="pr-3">Code:</span>
          {markup}
        </div>
      );
    }
    return null;
  }

  render() {
    let error = null;
    if (this.state.error) {
      error = (
        <div key="error" className="row" style={{ margin: "0 2em" }}>
          <div className="col-md-12">{this.state.error}</div>
        </div>
      );
    }
    return [
      error,
      <BouncerWrapper key={0} showBouncer={this.state.loadingColumns}>
        {this.renderBody()}
      </BouncerWrapper>,
      <div key={1} className="modal-footer">
        {this.renderCode()}
        <button className="btn btn-primary" onClick={this.state.loadingColumn ? _.noop : this.save}>
          <BouncerWrapper showBouncer={this.state.loadingColumn}>
            <span>Create</span>
          </BouncerWrapper>
        </button>
      </div>,
    ];
  }
}
ReactCreateColumn.displayName = "CreateColumn";
ReactCreateColumn.propTypes = {
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    propagateState: PropTypes.func,
  }),
  onClose: PropTypes.func,
};

const ReduxCreateColumn = connect(
  ({ dataId, chartData }) => ({ dataId, chartData }),
  dispatch => ({ onClose: chartData => dispatch(closeChart(chartData || {})) })
)(ReactCreateColumn);
export { ReactCreateColumn, ReduxCreateColumn as CreateColumn };
