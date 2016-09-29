from flask import Flask, render_template, request
import requests
import httplib
import json
from urllib2 import Request, urlopen

app = Flask(__name__)
HEADERS = {'Cache-Control': 'private, max-age=0, no-cache',  # "max-age" overrides "expires"
           'Content-type': 'application/json'}

stash_api = "http://stash-stg01.sats.corp:7990/rest/api/1.0"

CONF = None
with open("conf/conf.py") as f:
    CONF = json.loads(f.read())


@app.route('/')
def hello_world():
    return render_template("index.html")


@app.route('/hipchat', methods=['GET'])
def send_hipchat_msg():
    pull_req_url = request.args.get('pullReqURL', "")
    V2TOKEN = CONF['hipchat_room_token']
    url = 'https://api.hipchat.com/v2/room/%d/notification' % CONF['hipchat_room_id']
    message = "<b>A pull request has been marked as URGENT in pulley. Please review it here: </b><br><em><a href='%s'>%s</a></em>" % (
        pull_req_url, pull_req_url)
    headers = {
        "content-type": "application/json",
        "authorization": "Bearer %s" % V2TOKEN}
    data_string = json.dumps({
        'message': message,
        'color': 'yellow',
        'message_format': 'html',
        'notify': True})
    msg_request = Request(url, headers=headers, data=data_string)
    url_request = urlopen(msg_request)
    raw_response = ''.join(url_request)
    url_request.close()
    assert url_request.code == 204
    return json.dumps(
        {"status": "OK", "message": str(raw_response), "description": "sent successfully"}), httplib.OK, HEADERS


@app.route('/pull-requests', methods=['GET'])
def get_pull_requests():
    all_pull_reqs = []
    for ps in CONF['projects'].keys():
        for val in CONF['projects'][ps]:
            all_pull_reqs.append((requests.get(get_pull_req_url(ps, val),
                                               headers={
                                                   "Authorization": "Basic %s" % CONF['stash_auth_token']})).text)
    return json.dumps(all_pull_reqs), httplib.OK, HEADERS


@app.route('/pull-requests/commits', methods=['GET'])
def get_pull_requests_commits():
    project_name = request.args.get('projectName', "")
    repo_name = request.args.get('repoName', "")
    pr_id = request.args.get('prID', 0)

    commits = requests.get(get_pull_req_url(project_name, repo_name) + "/" + str(pr_id) + "/commits",
                           headers={
                               "Authorization": "Basic %s" % CONF['stash_auth_token']}).text
    return json.dumps(commits), httplib.OK, HEADERS


def get_pull_req_url(project_name, repo_name):
    return stash_api + "/projects/" + project_name + "/repos/" + repo_name + "/pull-requests"


if __name__ == '__main__':
    app.run(debug=True)
