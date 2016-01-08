"use strict";

import React from "react";
import ReactDOM from "react-dom";
import Immutable from "immutable";

import LogMap from "./LogMap";
import LogDetails from "./LogDetails";
import LogName from "./LogName";

export default class Log extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      log: props.log,
      editing: false,
    };
  }

  onEdit() {
    if (!this.state.editing) {
      this.setState({
        editing: true,
        oldLog: this.state.log,
      });
    }
  }

  onNameChange(name: string) {
    this.setState({
      log: this.state.log.set("name", name),
    });
  }

  onSave(event) {
    this.setState({
      editing: false,
      oldLog: null,
    });

    window.fetch(`/logs/${this.state.log.get("id")}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-CSRF-Token": window.tracklog.csrfToken,
      },
      body: JSON.stringify({
        "name": this.state.log.get("name"),
      }),
    })
    .then((data) => {
      if (data.status != 204) {
        alert("Failed to save log");
        this.setState({
          editing: true,
          oldLog: this.state.log,
        });
      }
    })
    .catch((err) => {
      alert(err);
    });
  }

  onCancel(event) {
    this.setState({
      editing: false,
      log: this.state.oldLog,
      oldLog: null,
    });
  }

  get topRow() {
    if (this.state.editing) {
      return (
        <div className="row">
          <div className="col-md-9">
            <LogName log={this.state.log} editing={this.state.editing} onChange={this.onNameChange.bind(this)} />
          </div>
          <div className="col-md-3">
            <div className="row">
              <div className="col-sm-6">
                <button className="btn btn-block btn-success" onClick={this.onSave.bind(this)}>Save</button>
              </div>
              <div className="col-sm-6">
                <button className="btn btn-block btn-danger" onClick={this.onCancel.bind(this)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="row">
        <div className="col-md-12">
          <LogName log={this.state.log} editing={this.state.editing} />
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="log">
        {this.topRow}
        <div className="row">
          <div className="col-md-9">
            <LogMap log={this.state.log} />
          </div>
          <div className="col-md-3">
            <LogDetails log={this.state.log} onEdit={this.onEdit.bind(this)} editing={this.state.editing} />
          </div>
        </div>
      </div>
    );
  }
}

export function renderLog(container, log) {
  const immutableLog = Immutable.fromJS(log);
  ReactDOM.render(<Log log={immutableLog} />, container);
}
