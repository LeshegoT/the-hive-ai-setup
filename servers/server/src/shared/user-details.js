const { getActiveDirectoryProfile } = require('./active-directory-profile');

const getUserDetails = async (people) => {
  const peopleDetails = [];
  for (const person of people) {
    let ADInfo = undefined;

    if (!person.displayName) {
      const ADResponse = await getActiveDirectoryProfile(
        person.userPrincipleName
      );
      if (!ADResponse.error) ADInfo = ADResponse;
    }

    const user = {
      displayName: ADInfo ? ADInfo.displayName : person.displayName,
      bbdUserName: ADInfo
        ? ADInfo.onPremisesSamAccountName
        : person.bbdUserName,
      jobTitle: ADInfo ? ADInfo.jobTitle : person.jobTitle,
      office: ADInfo ? ADInfo.officeLocation : person.office,
      department: ADInfo ? ADInfo.department : person.department,
      userPrincipleName: ADInfo
        ? ADInfo.userPrincipalName
        : person.userPrincipleName,
    };

    peopleDetails.push(user);
  }

  return peopleDetails;
};

module.exports = {
  getUserDetails,
};
