install.packages("ggplot2")
install.packages("dplyr")
install.packages("corrplot")

library(ggplot2)
library(dplyr)
library(corrplot)

ibm <- read.csv("IBM.csv")

head(ibm)
tail(ibm)
dim(ibm)
colnames(ibm)
str(ibm)
summary(ibm)

colSums(is.na(ibm))

sum(duplicated(ibm))

sapply(ibm, class)

numeric_data <- ibm %>%
  select(where(is.numeric))

summary(numeric_data)

cor_matrix <- cor(numeric_data)

corrplot(cor_matrix,
         method = "color",
         type = "upper",
         tl.cex = 0.7)

ggplot(ibm, aes(x = Age)) +
  geom_histogram(binwidth = 5, fill = "steelblue", color = "black") +
  labs(title = "Distribution of Age")

ggplot(ibm, aes(x = MonthlyIncome)) +
  geom_histogram(fill = "orange", color = "black", bins = 30) +
  labs(title = "Monthly Income Distribution")

ggplot(ibm, aes(y = MonthlyIncome)) +
  geom_boxplot(fill = "tomato") +
  labs(title = "Monthly Income Boxplot")

ggplot(ibm, aes(x = Attrition, fill = Attrition)) +
  geom_bar() +
  labs(title = "Employee Attrition")

ggplot(ibm, aes(x = Department, fill = Department)) +
  geom_bar() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1)) +
  labs(title = "Employees by Department")

ggplot(ibm, aes(x = Department, fill = Attrition)) +
  geom_bar(position = "dodge") +
  theme(axis.text.x = element_text(angle = 45, hjust = 1)) +
  labs(title = "Attrition by Department")

ggplot(ibm, aes(x = factor(JobSatisfaction), fill = factor(JobSatisfaction))) +
  geom_bar() +
  labs(title = "Job Satisfaction", x = "Job Satisfaction")

ggplot(ibm, aes(x = factor(WorkLifeBalance), fill = factor(WorkLifeBalance))) +
  geom_bar() +
  labs(title = "Work-Life Balance", x = "Work-Life Balance")

ggplot(ibm, aes(x = Age, y = MonthlyIncome, color = Attrition)) +
  geom_point(size = 2) +
  labs(title = "Age vs Monthly Income")

ggplot(ibm, aes(x = YearsAtCompany)) +
  geom_histogram(fill = "purple", color = "black", bins = 20) +
  labs(title = "Years at Company")

ibm %>%
  group_by(Department) %>%
  summarise(AverageIncome = mean(MonthlyIncome))

prop.table(table(ibm$Attrition)) * 100

table(ibm$Department)

table(ibm$EducationField)

table(ibm$MaritalStatus)