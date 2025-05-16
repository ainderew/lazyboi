//TODO: change before pushing
const isProd = true;
const API_ENDPOINT = isProd ? 'https://workdash.site' : 'http://127.0.0.1:4200';
// reminder comment proper

fetch(`${API_ENDPOINT}/jira/user-undone-tickets`)
  .then((res) => {
    if (res.status > 400) {
      console.error('status error');
      //TODO: handle unauthed in google
      return;
    }

    return res.json();
  })
  .then((data) => {
    handleJiraTicketRender(data);
    initializeDrag();
  })
  .catch((err) => console.log(err));

function handleJiraTicketRender(responseData) {
  //list container
  const jiraTicketList = document.querySelector('.jira-tickets-list');

  const jiraTickets = responseData.map((el, index) => {
    const jiraTicketItem = document.createElement('div');
    jiraTicketItem.draggable = 'true';
    jiraTicketItem.className = 'jira-ticket element';

    const jiraTicketProjectIcon = document.createElement('img');
    jiraTicketProjectIcon.className = 'jira-ticket-project-img';
    jiraTicketProjectIcon.src = `${el.fields.project.avatarUrls['48x48']}`;

    const jiraTicketKey = document.createElement('span');
    jiraTicketKey.className = 'jira-ticket-key';
    jiraTicketKey.innerText = `${el.key}`;

    const jiraTicketStatus = document.createElement('span');
    jiraTicketStatus.className = 'jira-ticket-status';
    jiraTicketStatus.innerText = `${el.fields.status.name}`;

    const jiraTicketName = document.createElement('span');
    jiraTicketName.className = 'jira-ticket-name';
    jiraTicketName.innerText = `${el.fields.summary}`;

    const jiraTicketDueDate = document.createElement('span');
    if (el.fields.duedate) {
      jiraTicketDueDate.innerText = `Due: ${el.fields.duedate}`;
    }

    const jiraIssueTypeImg = document.createElement('img');
    jiraIssueTypeImg.className = 'jira-issue-type-img';
    jiraIssueTypeImg.src = `${el.fields.issuetype.iconUrl}`;

    const jiraIssueType = document.createElement('span');
    jiraIssueType.className = 'jira-issue-type';
    jiraIssueType.innerText = `${el.fields.issuetype.name}`;

    console.log(el.fields.project.name);

    //issutype-container
    const jiraIssueTypeContainer = document.createElement('div');
    jiraIssueTypeContainer.className = 'ticket-issue-type-container';

    jiraIssueTypeContainer.appendChild(jiraIssueTypeImg);
    jiraIssueTypeContainer.appendChild(jiraIssueType);

    //header-container
    const jiraTicketHeaderContainer = document.createElement('div');
    jiraTicketHeaderContainer.className = 'ticket-header-container';

    const descContainer = document.createElement('div');
    descContainer.className = 'desc-container';

    //attach header container to ticket
    jiraTicketItem.appendChild(jiraTicketHeaderContainer);

    descContainer.appendChild(jiraTicketProjectIcon);
    descContainer.appendChild(jiraTicketKey);

    jiraTicketHeaderContainer.appendChild(descContainer);
    jiraTicketHeaderContainer.appendChild(jiraTicketStatus);

    jiraTicketItem.appendChild(jiraTicketName);

    //attach issue container to ticket
    jiraTicketItem.appendChild(jiraIssueTypeContainer);
    jiraTicketItem.appendChild(jiraTicketDueDate);

    return jiraTicketItem;
  });

  jiraTickets.forEach((item) => jiraTicketList.appendChild(item));
}

function initializeDrag() {
  const tickets = document.querySelectorAll('.jira-ticket');
  const columns = document.querySelectorAll('.ticket-column');

  function handleDragStart(ticket) {
    ticket.classList.add('dragging');
  }

  function handleDragEnd(ticket) {
    ticket.classList.remove('dragging');
  }

  tickets.forEach((ticket) => {
    ticket.addEventListener('dragstart', () => handleDragStart(ticket));
    ticket.addEventListener('dragend', () => handleDragEnd(ticket));
  });

  columns.forEach((col) =>
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      const currTicket = document.querySelector('.dragging');
      col.prepend(currTicket);
    }),
  );
}
