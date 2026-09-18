// js/courses.js
// Real RUET CSE course codes, pulled from the department's OBE Curriculum booklet.
// Used to power the course-code dropdown on both the listing form and search bar,
// so students pick from actual course codes instead of typing free text.

const RUET_CSE_COURSES = [
  { code: "CSE 1100", title: "Computer Fundamentals and Ethics", year: "1st Year", semester: "Odd" },
  { code: "CSE 1101", title: "Structured Programming", year: "1st Year", semester: "Odd" },
  { code: "EEE 1151", title: "Basic Electrical Engineering", year: "1st Year", semester: "Odd" },
  { code: "Math 1113", title: "Differential and Integral Calculus", year: "1st Year", semester: "Odd" },
  { code: "Hum 1113", title: "Functional English", year: "1st Year", semester: "Odd" },
  { code: "Chem 1113", title: "Inorganic and Physical Chemistry", year: "1st Year", semester: "Odd" },

  { code: "CSE 1200", title: "Competitive Programming", year: "1st Year", semester: "Even" },
  { code: "CSE 1201", title: "Data Structure", year: "1st Year", semester: "Even" },
  { code: "CSE 1203", title: "Object Oriented Programming", year: "1st Year", semester: "Even" },
  { code: "EEE 1251", title: "Electronic Devices and Circuits", year: "1st Year", semester: "Even" },
  { code: "Math 1213", title: "Coordinate Geometry and Ordinary Differential Equation", year: "1st Year", semester: "Even" },
  { code: "Phy 1213", title: "Physics", year: "1st Year", semester: "Even" },

  { code: "CSE 2100", title: "Software Development Project I", year: "2nd Year", semester: "Odd" },
  { code: "CSE 2101", title: "Discrete Mathematics", year: "2nd Year", semester: "Odd" },
  { code: "CSE 2103", title: "Digital Logic Design", year: "2nd Year", semester: "Odd" },
  { code: "EEE 2151", title: "Electrical Drives and Instrumentations", year: "2nd Year", semester: "Odd" },
  { code: "Math 2113", title: "Vector Analysis and Linear Algebra", year: "2nd Year", semester: "Odd" },
  { code: "Hum 2113", title: "Economics, Government and Sociology", year: "2nd Year", semester: "Odd" },

  { code: "CSE 2200", title: "Technical Writing and Presentation", year: "2nd Year", semester: "Even" },
  { code: "CSE 2201", title: "Algorithm Analysis and Design", year: "2nd Year", semester: "Even" },
  { code: "CSE 2203", title: "Numerical Methods", year: "2nd Year", semester: "Even" },
  { code: "CSE 2205", title: "Microprocessors, Microcontrollers and Assembly Language", year: "2nd Year", semester: "Even" },
  { code: "Math 2213", title: "Complex Variable, Partial Differential Equation and Harmonic Analysis", year: "2nd Year", semester: "Even" },
  { code: "Hum 2213", title: "Industrial Management and Accountancy", year: "2nd Year", semester: "Even" },

  { code: "CSE 3100", title: "Web Based Application Project", year: "3rd Year", semester: "Odd" },
  { code: "CSE 3101", title: "Database Systems", year: "3rd Year", semester: "Odd" },
  { code: "CSE 3103", title: "Theory of Computation", year: "3rd Year", semester: "Odd" },
  { code: "CSE 3105", title: "Computer Interfacing and Embedded System", year: "3rd Year", semester: "Odd" },
  { code: "CSE 3107", title: "Computer Architecture", year: "3rd Year", semester: "Odd" },
  { code: "CSE 3109", title: "Applied Statistics and Queuing Theory", year: "3rd Year", semester: "Odd" },

  { code: "CSE 3200", title: "Software Development Project II", year: "3rd Year", semester: "Even" },
  { code: "CSE 3201", title: "Operating Systems", year: "3rd Year", semester: "Even" },
  { code: "CSE 3203", title: "Data Communication", year: "3rd Year", semester: "Even" },
  { code: "CSE 3205", title: "Software Engineering", year: "3rd Year", semester: "Even" },
  { code: "CSE 3207", title: "Artificial Intelligence", year: "3rd Year", semester: "Even" },
  { code: "CSE 3209", title: "Digital Signal Processing", year: "3rd Year", semester: "Even" },

  { code: "CSE 4101", title: "Compiler Design", year: "4th Year", semester: "Odd" },
  { code: "CSE 4103", title: "Computer Networks", year: "4th Year", semester: "Odd" },
  { code: "CSE 4105", title: "Digital Image Processing", year: "4th Year", semester: "Odd" },

  { code: "CSE 4201", title: "Computer Graphics", year: "4th Year", semester: "Even" },
  { code: "CSE 4203", title: "Machine Learning", year: "4th Year", semester: "Even" },
  { code: "CSE 4205", title: "Security and Privacy", year: "4th Year", semester: "Even" },
];

// Fills a <select> element with grouped <optgroup> options by year.
// Pass includeBlank=true to add a leading "All courses" option (used for search filters).
function populateCourseDropdown(selectElement, includeBlank = false) {
  selectElement.innerHTML = '';

  if (includeBlank) {
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = 'All courses';
    selectElement.appendChild(blank);
  }

  const years = [...new Set(RUET_CSE_COURSES.map(c => c.year))];

  years.forEach((year) => {
    const group = document.createElement('optgroup');
    group.label = year;

    RUET_CSE_COURSES
      .filter(c => c.year === year)
      .forEach((course) => {
        const opt = document.createElement('option');
        opt.value = course.code;
        opt.textContent = `${course.code} — ${course.title}`;
        group.appendChild(opt);
      });

    selectElement.appendChild(group);
  });
}
