FROM eecsautograder/ubuntu18:latest

# Install OpenJDK-11
RUN apt-get update && \
    apt-get install -y openjdk-11-jre-headless && \
    apt-get clean;

RUN echo 'export PS1="-> "' >> ~/.bashrc
RUN echo 'export PS1="-> "' >> /etc/profile

