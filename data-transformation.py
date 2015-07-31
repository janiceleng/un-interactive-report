
# coding: utf-8

# In[1]:

import csv
import sys
import numpy as np
import pandas as pd


# In[2]:

pd.set_option('display.mpl_style', 'default') # Make the graphs a bit prettier
#pd.set_option('display.line_width', 1000) 
#pd.set_option('display.max_columns', 15) 


# In[3]:

#load data
df = pd.read_csv('/Users/kms/Desktop/matrix.csv')

#remove a row
df = df.ix[1:]

#rename some columns
df.rename(columns= {'Unnamed: 4': 'Direction', 'Unnamed: 5':'Period'}, inplace=True)

#clean last columns
df=df.drop(df.columns[35:],axis=1)

#Fill in the blanks with specific values
#df.ix[df['Goal'].isin([1]),['Annual Target']] = '20%'

#The better way to fill in blanks
df['Annual Target']= df['Annual Target'].fillna(method='ffill')
df['Target Description']= df['Target Description'].fillna(method='ffill')
df['Units of Measurement']= df['Units of Measurement'].fillna(method='ffill')
df

#convert values to numeric (i think?)
df.convert_objects(convert_numeric=True);

#get array, or list(), of departments
departments = list(df.columns[6:])
#df = df.dtypes={'DESA': str}

#unpivot the matrix
df2 = pd.melt(df, id_vars=['Goal', 'Direction', 'Period','Annual Target'], value_vars=departments)
df2[df2['variable'] == 'ECA']


# In[4]:


#rename variable columns
df2.rename(columns= {'variable': 'dept'}, inplace=True)

#reorder columns
df2 = df2[['dept', 'Goal', 'Period', 'value','Direction','Annual Target']]


#Replace values in Period column
#df2.ix[df2['Period'] == 'Baseline end 2013','Period'] = 'Baseline'
#df2.ix[df2['Period'] == 'Progress as of July 2014','Period'] = 'Mid'
#df2.ix[df2['Period'] == 'Progress YTD Nov 2014','Period'] = '2014-11-31'
#df2.ix[df2['Period'] == 'Year End 2014','Period'] = 'End'

#restructure data 
stacked = df2.set_index(['dept', 'Goal', 'Period','Direction','Annual Target'])
stacked = stacked.unstack('Period').reset_index()

#delete all rows where there are 5 N/A's across, which is the indicator that a dept will not be assessed on that goal
stacked = stacked.convert_objects(convert_numeric=True).dropna(thresh=5)
#stacked = stacked.convert_objects().dropna(thresh=5)

#fill in missing values with values from the previous report
stacked.loc[stacked['value']['Progress as of July 2014'].isnull(),('value','Progress as of July 2014')] = stacked['value']['Baseline end 2013']
stacked.loc[stacked['value']['Year End 2014'].isnull(),('value','Year End 2014')] = stacked['value']['Progress as of July 2014']
stacked[:10]


# In[21]:

#Mid Year Calculations
stacked['% at Mid']= np.where(stacked['Direction'] == 'Down',
            #if it's Down 
            np.where(stacked['value']['Progress as of July 2014']<= stacked['value']['Target 2014'], 
                           100,
                           (stacked['value']['Baseline end 2013']- stacked['value']['Progress as of July 2014']) / abs(stacked['value']['Baseline end 2013'] - stacked['value']['Target 2014'])*100
                  ),
            #if it's Up
            np.where(stacked['value']['Progress as of July 2014']>= stacked['value']['Target 2014'],
                            100,
                            (stacked['value']['Progress as of July 2014']- stacked['value']['Baseline end 2013']) / abs(stacked['value']['Target 2014'] - stacked['value']['Baseline end 2013'])*100
                   )
            )

#Year End Calculations
stacked['% at End']= np.where(stacked['Direction'] == 'Down',
            #if it's Down 
            np.where(stacked['value']['Year End 2014']<= stacked['value']['Target 2014'], 
                             100, 
                             (stacked['value']['Baseline end 2013']- stacked['value']['Year End 2014']) / abs(stacked['value']['Baseline end 2013'] - stacked['value']['Target 2014'])*100
                             ),

             #if it's Up
             #if End is null
             np.where(stacked['value']['Year End 2014']>= stacked['value']['Target 2014'], 
                               100, 
                               np.where(stacked['value']['Target 2014'] >0,
                                        (stacked['value']['Year End 2014']- stacked['value']['Baseline end 2013']) / abs(stacked['value']['Target 2014'] - stacked['value']['Baseline end 2013'])*100,
                                        0)
                     )
)        

#Correct for negative numbers so that averages are not too inflated
stacked['% at Mid'] = np.where(stacked['% at Mid'] <0,
                               0,
                               stacked['% at Mid'])
stacked['% at Mid'] = np.where(stacked['% at Mid'] >100,
                               0,
                               stacked['% at Mid'])

stacked['% at End'] = np.where(stacked['% at End'] <0,
                               0,
                               stacked['% at End'])

stacked['% at End'] = np.where(stacked['% at End'] >100,
                               1,
                               stacked['% at End'])

#stacked[stacked['dept']=='DESA']


# In[6]:

#Catch any errors
#Get the rows where no year end value was reported 
stacked[pd.isnull(stacked['% at Mid']) | pd.isnull(stacked['% at End'])]
#df[df['Goal'] ==1]


# In[7]:

groupedGoal = stacked.groupby('Goal')

#goals-overall.csv
goalsOverall = pd.DataFrame()
goalsOverall['id'] = 'goal' + groupedGoal['Goal'].max().astype(int).astype(str)
goalsOverall['2014Q2'] = groupedGoal['% at Mid'].mean()
goalsOverall['2014Q4'] = groupedGoal['% at End'].mean()
goalsOverall.to_csv('/Users/kms/Desktop/goals-overall.csv')
goalsOverall


#pd.melt(stacked, id_vars=['dept', 'Goal', 'Period', 'value','Direction','Annual Target'], value_vars=)


# In[8]:

groupedDept = stacked.groupby('dept')

deptsOverall = pd.DataFrame()
deptsOverall['2014Q2'] = groupedDept['% at Mid'].mean()
deptsOverall['2014Q4'] = groupedDept['% at End'].mean()
deptsOverall.to_csv('/Users/kms/Desktop/depts-overall.csv')
deptsOverall


# In[19]:

stacked['Goal'] = stacked['Goal'].astype('int8')
stacked.to_csv('/Users/kms/Desktop/raw6.csv')
stacked.head()


# In[34]:

perDept = pd.DataFrame()
perDept['dept'] = stacked['dept']
perDept['Goal'] = 'Goal ' + stacked['Goal'].astype(str)
#perDept['2014Q2'] = stacked['% at Mid']
perDept['2014Q4'] = stacked['% at End']
perDept.to_csv('/Users/kms/Desktop/perDept.csv')
#perDept[perDept['dept']=='DESA']


# In[ ]:



